import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Printer, Download } from "lucide-react";
import { format, parseISO } from "date-fns";

// Print-friendly wrapper for exporting records
export const PrintableExport = ({ 
  title, 
  records, 
  type, // 'journal' | 'violation'
  children: childrenData = [],
  userName = ""
}) => {
  const printRef = useRef(null);

  const handlePrint = () => {
    const printContent = printRef.current;
    const printWindow = window.open('', '_blank');
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title} - CustodyKeeper Export</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700&family=Lato:wght@400;700&display=swap');
            
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            
            body {
              font-family: 'Lato', sans-serif;
              color: #1A202C;
              line-height: 1.6;
              padding: 40px;
              max-width: 800px;
              margin: 0 auto;
            }
            
            h1, h2, h3 {
              font-family: 'Merriweather', serif;
            }
            
            .header {
              text-align: center;
              border-bottom: 2px solid #2C3E50;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            
            .header h1 {
              font-size: 24px;
              color: #2C3E50;
              margin-bottom: 5px;
            }
            
            .header p {
              color: #718096;
              font-size: 14px;
            }
            
            .record {
              border: 1px solid #E2E8F0;
              border-radius: 8px;
              padding: 20px;
              margin-bottom: 20px;
              page-break-inside: avoid;
            }
            
            .record-header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 10px;
            }
            
            .record-title {
              font-size: 18px;
              font-weight: 700;
              color: #1A202C;
            }
            
            .record-date {
              font-size: 12px;
              color: #718096;
              background: #F7FAFC;
              padding: 4px 8px;
              border-radius: 4px;
            }
            
            .record-content {
              color: #4A5568;
              white-space: pre-wrap;
              margin-top: 10px;
            }
            
            .record-meta {
              display: flex;
              flex-wrap: wrap;
              gap: 10px;
              margin-top: 15px;
              padding-top: 15px;
              border-top: 1px solid #E2E8F0;
              font-size: 12px;
            }
            
            .meta-item {
              background: #E8F6F3;
              color: #2C3E50;
              padding: 4px 10px;
              border-radius: 4px;
            }
            
            .severity-high {
              background: #FEE2E2;
              color: #991B1B;
            }
            
            .severity-medium {
              background: #FEF3C7;
              color: #92400E;
            }
            
            .severity-low {
              background: #DBEAFE;
              color: #1E40AF;
            }
            
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 2px solid #2C3E50;
              text-align: center;
              font-size: 12px;
              color: #718096;
            }
            
            .page-number {
              text-align: right;
              font-size: 10px;
              color: #718096;
            }
            
            @media print {
              body {
                padding: 20px;
              }
              
              .record {
                box-shadow: none;
              }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const getChildName = (childId) => {
    const child = childrenData.find(c => c.child_id === childId);
    return child?.name || 'Unknown';
  };

  return (
    <>
      <Button
        variant="outline"
        onClick={handlePrint}
        className="border-border"
        data-testid="print-export-btn"
      >
        <Printer className="w-4 h-4 mr-2" /> Print
      </Button>

      {/* Hidden printable content */}
      <div ref={printRef} style={{ display: 'none' }}>
        <div className="header">
          <h1>CustodyKeeper - {title}</h1>
          <p>Generated on {format(new Date(), "MMMM d, yyyy 'at' h:mm a")}</p>
          {userName && <p>Prepared by: {userName}</p>}
        </div>

        {records.map((record, index) => (
          <div key={record.journal_id || record.violation_id || index} className="record">
            <div className="record-header">
              <span className="record-title">
                {type === 'journal' ? record.title : `${record.type || record.violation_type} Violation`}
              </span>
              <span className="record-date">
                {format(parseISO(record.date), "MMMM d, yyyy")}
              </span>
            </div>
            
            <div className="record-content">
              {type === 'journal' ? record.content : record.description}
            </div>
            
            <div className="record-meta">
              {type === 'journal' && record.mood && (
                <span className="meta-item">Mood: {record.mood}</span>
              )}
              {type === 'journal' && record.location && (
                <span className="meta-item">Location: {record.location}</span>
              )}
              {type === 'journal' && record.children_involved?.length > 0 && (
                <span className="meta-item">
                  Children: {record.children_involved.map(id => getChildName(id)).join(', ')}
                </span>
              )}
              {type === 'violation' && record.severity && (
                <span className={`meta-item severity-${record.severity.toLowerCase()}`}>
                  Severity: {record.severity}
                </span>
              )}
              {type === 'violation' && record.witnesses && (
                <span className="meta-item">Witnesses: {record.witnesses}</span>
              )}
            </div>
          </div>
        ))}

        <div className="footer">
          <p>This document was generated by CustodyKeeper for record-keeping purposes.</p>
          <p>Total Records: {records.length}</p>
        </div>
      </div>
    </>
  );
};

export default PrintableExport;
