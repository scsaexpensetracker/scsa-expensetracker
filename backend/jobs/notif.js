import cron from 'node-cron';
import TuitionFee from '../models/TuitionFee.js';
import Event from '../models/Event.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';

// Helper function to check if notification already exists
const notificationExists = async (LRN, title, type, school_year) => {
  const existing = await Notification.findOne({
    LRN,
    title,
    type,
    school_year,
    createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Check last 24 hours
  });
  return !!existing;
};

// Helper function to calculate days until deadline
const getDaysUntil = (date) => {
  const now = new Date();
  const deadline = new Date(date);
  const diffTime = deadline - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// 1. Check tuition fee deadlines (1 week warning)
const checkTuitionFeeDeadlines = async () => {
  try {
    const oneWeekFromNow = new Date();
    oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);

    const upcomingDueFees = await TuitionFee.find({
      status: { $in: ['Unpaid', 'Partially Paid'] },
      due_date: {
        $gte: new Date(),
        $lte: oneWeekFromNow
      }
    });

    for (const fee of upcomingDueFees) {
      const daysLeft = getDaysUntil(fee.due_date);
      
      if (daysLeft <= 7 && daysLeft > 0) {
        const exists = await notificationExists(
          fee.LRN,
          `Tuition Fee Deadline Approaching - ${fee.semester}`,
          'Payment Reminder',
          fee.school_year
        );

        if (!exists) {
          await Notification.create({
            LRN: fee.LRN,
            title: `Tuition Fee Deadline Approaching - ${fee.semester}`,
            message: `Your tuition fee payment for ${fee.semester} (${fee.school_year}) is due in ${daysLeft} ${daysLeft === 1 ? 'day' : 'days'}. Balance: ₱${fee.balance.toLocaleString()}. Please make your payment before ${new Date(fee.due_date).toLocaleDateString()}.`,
            type: 'Payment Reminder',
            priority: daysLeft <= 3 ? 'High' : 'Medium',
            related_module: 'Tuition Fees',
            school_year: fee.school_year
          });
          console.log(`Created deadline notification for ${fee.LRN} - ${daysLeft} days left`);
        }
      }
    }
  } catch (error) {
    console.error('Error checking tuition fee deadlines:', error);
  }
};

// 2. Check overdue tuition fees
const checkOverdueTuitionFees = async () => {
  try {
    const overdueFees = await TuitionFee.find({
      status: { $in: ['Unpaid', 'Partially Paid', 'Overdue'] },
      due_date: { $lt: new Date() }
    });

    for (const fee of overdueFees) {
      // Update status to Overdue if not already
      if (fee.status !== 'Overdue') {
        fee.status = 'Overdue';
        await fee.save();
      }

      const daysOverdue = Math.abs(getDaysUntil(fee.due_date));
      
      const exists = await notificationExists(
        fee.LRN,
        `Overdue Tuition Fee - ${fee.semester}`,
        'Due Date',
        fee.school_year
      );

      if (!exists) {
        await Notification.create({
          LRN: fee.LRN,
          title: `Overdue Tuition Fee - ${fee.semester}`,
          message: `Your tuition fee payment for ${fee.semester} (${fee.school_year}) is now ${daysOverdue} ${daysOverdue === 1 ? 'day' : 'days'} overdue. Balance: ₱${fee.balance.toLocaleString()}. Please settle your payment as soon as possible.`,
          type: 'Due Date',
          priority: 'High',
          related_module: 'Tuition Fees',
          school_year: fee.school_year
        });
        console.log(`Created overdue notification for ${fee.LRN} - ${daysOverdue} days overdue`);
      }
    }
  } catch (error) {
    console.error('Error checking overdue tuition fees:', error);
  }
};

// 3. Notify students of new events (called when event is created, but also checks for recent events)
const checkNewEvents = async () => {
  try {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const recentEvents = await Event.find({
      createdAt: { $gte: oneDayAgo },
      status: 'Active'
    });

    for (const event of recentEvents) {
      let studentsToNotify = [];

      if (event.pricing_model === 'per_student') {
        // Get all students who have payments for this event
        studentsToNotify = event.payments.map(p => p.student_id);
      } else if (event.pricing_model === 'section') {
        // Get all students in the target sections
        const targetSections = event.target_sections.map(ts => ({
          section: ts.section,
          strand: ts.strand
        }));

        for (const target of targetSections) {
          const students = await User.find({
            section: target.section,
            strand: target.strand,
            role: 'student'
          });
          studentsToNotify.push(...students.map(s => s.LRN));
        }
      }

      // Remove duplicates
      studentsToNotify = [...new Set(studentsToNotify)];

      for (const studentLRN of studentsToNotify) {
        const exists = await notificationExists(
          studentLRN,
          `New Event: ${event.event_name}`,
          'Event Reminder',
          new Date().getFullYear().toString()
        );

        if (!exists) {
          await Notification.create({
            LRN: studentLRN,
            title: `New Event: ${event.event_name}`,
            message: `You have been assigned to "${event.event_name}" (${event.event_type}). Event Date: ${new Date(event.event_date).toLocaleDateString()}. Payment Amount: ₱${event.pricing_model === 'section' ? 'Section-based payment' : event.amount_per_student.toLocaleString()}. Payment Deadline: ${new Date(event.payment_deadline).toLocaleDateString()}.`,
            type: 'Event Reminder',
            priority: 'Medium',
            related_module: 'Events',
            school_year: new Date().getFullYear().toString()
          });
          console.log(`Created new event notification for ${studentLRN} - ${event.event_name}`);
        }
      }
    }
  } catch (error) {
    console.error('Error checking new events:', error);
  }
};

// 4. Check event payment deadlines (1 week warning)
const checkEventDeadlines = async () => {
  try {
    const oneWeekFromNow = new Date();
    oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);

    const upcomingEvents = await Event.find({
      status: 'Active',
      payment_deadline: {
        $gte: new Date(),
        $lte: oneWeekFromNow
      }
    });

    for (const event of upcomingEvents) {
      const daysLeft = getDaysUntil(event.payment_deadline);

      if (daysLeft <= 7 && daysLeft > 0) {
        // For per_student pricing model
        if (event.pricing_model === 'per_student') {
          const unpaidPayments = event.payments.filter(
            p => p.status === 'Unpaid' && !p.is_exempted
          );

          for (const payment of unpaidPayments) {
            const exists = await notificationExists(
              payment.student_id,
              `Event Payment Deadline Approaching - ${event.event_name}`,
              'Payment Reminder',
              new Date().getFullYear().toString()
            );

            if (!exists) {
              await Notification.create({
                LRN: payment.student_id,
                title: `Event Payment Deadline Approaching - ${event.event_name}`,
                message: `Payment for "${event.event_name}" is due in ${daysLeft} ${daysLeft === 1 ? 'day' : 'days'}. Amount: ₱${event.amount_per_student.toLocaleString()}. Event Date: ${new Date(event.event_date).toLocaleDateString()}. Please make your payment before ${new Date(event.payment_deadline).toLocaleDateString()}.`,
                type: 'Payment Reminder',
                priority: daysLeft <= 3 ? 'High' : 'Medium',
                related_module: 'Events',
                school_year: new Date().getFullYear().toString()
              });
              console.log(`Created event deadline notification for ${payment.student_id} - ${event.event_name}`);
            }
          }
        }
        // For section pricing model
        else if (event.pricing_model === 'section') {
          const unpaidSections = event.section_payments.filter(sp => sp.status === 'Unpaid');

          for (const sectionPayment of unpaidSections) {
            // Find all students in this section
            const students = await User.find({
              section: sectionPayment.section,
              strand: sectionPayment.strand,
              role: 'student'
            });

            for (const student of students) {
              const exists = await notificationExists(
                student.LRN,
                `Event Payment Deadline Approaching - ${event.event_name}`,
                'Payment Reminder',
                new Date().getFullYear().toString()
              );

              if (!exists) {
                await Notification.create({
                  LRN: student.LRN,
                  title: `Event Payment Deadline Approaching - ${event.event_name}`,
                  message: `Payment for "${event.event_name}" is due in ${daysLeft} ${daysLeft === 1 ? 'day' : 'days'}. Your section (${sectionPayment.section} - ${sectionPayment.strand}) needs to pay ₱${sectionPayment.amount.toLocaleString()}. Event Date: ${new Date(event.event_date).toLocaleDateString()}. Payment Deadline: ${new Date(event.payment_deadline).toLocaleDateString()}.`,
                  type: 'Payment Reminder',
                  priority: daysLeft <= 3 ? 'High' : 'Medium',
                  related_module: 'Events',
                  school_year: new Date().getFullYear().toString()
                });
                console.log(`Created event deadline notification for ${student.LRN} - ${event.event_name}`);
              }
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Error checking event deadlines:', error);
  }
};

// 5. Check overdue event payments
const checkOverdueEventPayments = async () => {
  try {
    const overdueEvents = await Event.find({
      status: 'Active',
      payment_deadline: { $lt: new Date() }
    });

    for (const event of overdueEvents) {
      // Update event status to Overdue if not already
      if (event.status === 'Active') {
        event.status = 'Overdue';
        await event.save();
      }

      const daysOverdue = Math.abs(getDaysUntil(event.payment_deadline));

      // For per_student pricing model
      if (event.pricing_model === 'per_student') {
        const unpaidPayments = event.payments.filter(
          p => p.status === 'Unpaid' && !p.is_exempted
        );

        for (const payment of unpaidPayments) {
          const exists = await notificationExists(
            payment.student_id,
            `Overdue Event Payment - ${event.event_name}`,
            'Due Date',
            new Date().getFullYear().toString()
          );

          if (!exists) {
            await Notification.create({
              LRN: payment.student_id,
              title: `Overdue Event Payment - ${event.event_name}`,
              message: `Your payment for "${event.event_name}" is now ${daysOverdue} ${daysOverdue === 1 ? 'day' : 'days'} overdue. Amount: ₱${event.amount_per_student.toLocaleString()}. Event Date: ${new Date(event.event_date).toLocaleDateString()}. Please settle your payment immediately.`,
              type: 'Due Date',
              priority: 'High',
              related_module: 'Events',
              school_year: new Date().getFullYear().toString()
            });
            console.log(`Created overdue event notification for ${payment.student_id} - ${event.event_name}`);
          }
        }
      }
      // For section pricing model
      else if (event.pricing_model === 'section') {
        const unpaidSections = event.section_payments.filter(sp => sp.status === 'Unpaid');

        for (const sectionPayment of unpaidSections) {
          const students = await User.find({
            section: sectionPayment.section,
            strand: sectionPayment.strand,
            role: 'student'
          });

          for (const student of students) {
            const exists = await notificationExists(
              student.LRN,
              `Overdue Event Payment - ${event.event_name}`,
              'Due Date',
              new Date().getFullYear().toString()
            );

            if (!exists) {
              await Notification.create({
                LRN: student.LRN,
                title: `Overdue Event Payment - ${event.event_name}`,
                message: `Payment for "${event.event_name}" is now ${daysOverdue} ${daysOverdue === 1 ? 'day' : 'days'} overdue. Your section (${sectionPayment.section} - ${sectionPayment.strand}) needs to pay ₱${sectionPayment.amount.toLocaleString()}. Please coordinate with your section to settle this payment immediately.`,
                type: 'Due Date',
                priority: 'High',
                related_module: 'Events',
                school_year: new Date().getFullYear().toString()
              });
              console.log(`Created overdue event notification for ${student.LRN} - ${event.event_name}`);
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Error checking overdue event payments:', error);
  }
};

// Main function to run all checks
const runNotificationChecks = async () => {
  console.log(`[${new Date().toISOString()}] Running notification checks...`);
  
  try {
    await checkTuitionFeeDeadlines();
    await checkOverdueTuitionFees();
    await checkNewEvents();
    await checkEventDeadlines();
    await checkOverdueEventPayments();
    
    console.log(`[${new Date().toISOString()}] Notification checks completed.`);
  } catch (error) {
    console.error('Error running notification checks:', error);
  }
};

// Schedule to run every hour
// Format: '0 * * * *' means at minute 0 of every hour
const scheduleNotificationJobs = () => {
  cron.schedule('0 * * * *', () => {
    runNotificationChecks();
  });

  console.log('Notification cron job scheduled to run every hour');
  
  // Run immediately on startup
  runNotificationChecks();
};

export default scheduleNotificationJobs;