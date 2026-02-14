import jsPDF from 'jspdf';
import { format, parseISO } from 'date-fns';

// Court-ready PDF export for journals and violations
export const generateCourtReadyPDF = ({ 
  title, 
  records, 
  type, // 'journal' | 'violation'
  children = [],
  userName = "",
  userState = ""
}) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPos = 20;

  // Helper function to add new page if needed
  const checkNewPage = (requiredSpace = 40) => {
    if (yPos + requiredSpace > pageHeight - 20) {
      doc.addPage();
      yPos = 20;
      return true;
    }
    return false;
  };

  // Header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('CUSTODYKEEPER', pageWidth / 2, yPos, { align: 'center' });
  yPos += 8;
  
  doc.setFontSize(14);
  doc.text(title.toUpperCase(), pageWidth / 2, yPos, { align: 'center' });
  yPos += 10;

  // Document info box
  doc.setDrawColor(200, 200, 200);
  doc.setFillColor(248, 248, 248);
  doc.roundedRect(14, yPos, pageWidth - 28, 25, 2, 2, 'FD');
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  
  const generatedDate = format(new Date(), "MMMM d, yyyy 'at' h:mm a");
  doc.text(`Generated: ${generatedDate}`, 20, yPos + 8);
  doc.text(`Prepared by: ${userName || 'Parent'}`, 20, yPos + 15);
  doc.text(`State: ${userState || 'N/A'}`, 20, yPos + 22);
  doc.text(`Total Records: ${records.length}`, pageWidth - 60, yPos + 15);
  
  yPos += 35;

  // Disclaimer
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text(
    'This document is generated for record-keeping purposes. Verify all information before submission to court.',
    pageWidth / 2, yPos, { align: 'center' }
  );
  yPos += 15;

  // Records
  doc.setTextColor(0, 0, 0);
  
  records.forEach((record, index) => {
    checkNewPage(60);
    
    // Record header with number
    doc.setFillColor(44, 62, 80);
    doc.roundedRect(14, yPos, pageWidth - 28, 10, 2, 2, 'F');
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    
    const recordTitle = type === 'journal' 
      ? record.title 
      : `${record.type || record.violation_type || 'Violation'} - ${record.severity || 'N/A'} Severity`;
    
    doc.text(`Record #${index + 1}: ${recordTitle}`, 20, yPos + 7);
    
    const recordDate = format(parseISO(record.date), "MMMM d, yyyy");
    doc.text(recordDate, pageWidth - 50, yPos + 7);
    
    yPos += 15;
    doc.setTextColor(0, 0, 0);
    
    // Record content box
    doc.setDrawColor(220, 220, 220);
    doc.setFillColor(255, 255, 255);
    
    const content = type === 'journal' ? record.content : record.description;
    const contentLines = doc.splitTextToSize(content || 'No content provided.', pageWidth - 40);
    const contentHeight = Math.max(contentLines.length * 5 + 30, 40);
    
    checkNewPage(contentHeight + 10);
    
    doc.roundedRect(14, yPos, pageWidth - 28, contentHeight, 2, 2, 'FD');
    
    // Content
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(contentLines, 20, yPos + 8);
    
    // Metadata row
    const metaY = yPos + contentHeight - 12;
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    
    if (type === 'journal') {
      let metaText = [];
      if (record.mood) metaText.push(`Mood: ${record.mood}`);
      if (record.location) metaText.push(`Location: ${record.location}`);
      if (record.children_involved?.length > 0) {
        const childNames = record.children_involved.map(id => {
          const child = children.find(c => c.child_id === id);
          return child?.name || 'Unknown';
        }).join(', ');
        metaText.push(`Children: ${childNames}`);
      }
      doc.text(metaText.join('  |  '), 20, metaY);
    } else {
      let metaText = [];
      if (record.witnesses) metaText.push(`Witnesses: ${record.witnesses}`);
      if (record.evidence_notes) metaText.push(`Evidence: ${record.evidence_notes}`);
      doc.text(metaText.join('  |  '), 20, metaY);
    }
    
    doc.setTextColor(0, 0, 0);
    yPos += contentHeight + 10;
  });

  // Footer on each page
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
    doc.text(
      'CustodyKeeper - Family Court Documentation',
      pageWidth - 20,
      pageHeight - 10,
      { align: 'right' }
    );
  }

  // Save the PDF
  const fileName = `CustodyKeeper_${type === 'journal' ? 'Journal' : 'Violations'}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
  doc.save(fileName);
  
  return fileName;
};

export default generateCourtReadyPDF;
