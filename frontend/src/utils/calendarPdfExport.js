import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';

export const generateCalendarPDF = ({ 
  events, 
  month,
  children = [],
  userName = "",
  userState = ""
}) => {
  const doc = new jsPDF('landscape');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('CUSTODYKEEPER', 14, 15);
  
  doc.setFontSize(16);
  doc.text(`Calendar - ${format(month, 'MMMM yyyy')}`, 14, 25);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text(`Generated: ${format(new Date(), "MMMM d, yyyy")}`, 14, 32);
  if (userName) doc.text(`Prepared by: ${userName}`, 14, 37);
  
  doc.setTextColor(0);

  // Create calendar table
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Group events by date
  const eventsByDate = {};
  events.forEach(event => {
    const dateKey = event.start_date;
    if (!eventsByDate[dateKey]) {
      eventsByDate[dateKey] = [];
    }
    eventsByDate[dateKey].push(event);
  });

  // Create weeks array
  const weeks = [];
  let currentWeek = new Array(7).fill('');
  
  days.forEach((day, index) => {
    const dayOfWeek = day.getDay();
    const dateStr = format(day, 'yyyy-MM-dd');
    const dayEvents = eventsByDate[dateStr] || [];
    
    let cellContent = format(day, 'd');
    if (dayEvents.length > 0) {
      cellContent += '\n' + dayEvents.map(e => `• ${e.title}`).join('\n');
    }
    
    currentWeek[dayOfWeek] = cellContent;
    
    // If Saturday or last day, push week
    if (dayOfWeek === 6 || index === days.length - 1) {
      weeks.push([...currentWeek]);
      currentWeek = new Array(7).fill('');
    }
  });

  // Create table
  doc.autoTable({
    head: [daysOfWeek],
    body: weeks,
    startY: 45,
    styles: {
      cellPadding: 3,
      fontSize: 8,
      valign: 'top',
      lineColor: [200, 200, 200],
      lineWidth: 0.5,
    },
    headStyles: {
      fillColor: [44, 62, 80],
      textColor: 255,
      fontStyle: 'bold',
      halign: 'center',
    },
    columnStyles: {
      0: { cellWidth: 38 },
      1: { cellWidth: 38 },
      2: { cellWidth: 38 },
      3: { cellWidth: 38 },
      4: { cellWidth: 38 },
      5: { cellWidth: 38 },
      6: { cellWidth: 38 },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.cell.text[0]) {
        // Highlight cells with events
        const hasEvent = data.cell.text.length > 1 || data.cell.text[0].includes('•');
        if (hasEvent) {
          data.cell.styles.fillColor = [232, 246, 243];
        }
      }
    }
  });

  // Events List
  const finalY = doc.lastAutoTable.finalY + 10;
  
  if (events.length > 0 && finalY < pageHeight - 40) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Events This Month', 14, finalY);
    
    const eventRows = events.map(event => [
      format(parseISO(event.start_date), 'MMM d'),
      event.title,
      event.event_type.replace(/_/g, ' '),
      event.location || '-',
      event.notes?.substring(0, 50) || '-'
    ]);

    doc.autoTable({
      head: [['Date', 'Event', 'Type', 'Location', 'Notes']],
      body: eventRows,
      startY: finalY + 5,
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [44, 62, 80],
        textColor: 255,
      },
    });
  }

  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  // Save
  const fileName = `CustodyKeeper_Calendar_${format(month, 'yyyy-MM')}.pdf`;
  doc.save(fileName);
  
  return fileName;
};

export default generateCalendarPDF;
