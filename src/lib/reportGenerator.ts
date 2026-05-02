import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface ViolationReportData {
  id: string;
  brandName: string;
  pirateUrl: string;
  timestamp: string;
  status: string;
  source?: string;
  evidenceImage?: string;
  screenshot_source?: string;
  screenshot_tracker?: string;
  screenshot_destination?: string;
  redirectPath?: string[];
  middlemanUrl?: string;
}

export const generateForensicReport = async (violation: ViolationReportData) => {
  const doc = new jsPDF();
  const timestamp = new Date().toLocaleString();

  // Header
  doc.setFontSize(22);
  doc.setTextColor(40, 40, 40);
  doc.text('AD-STRANGLE', 14, 22);
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('REVENUE RECOVERY & BRAND PROTECTION UNIT', 14, 28);
  doc.setDrawColor(0, 180, 216); 
  doc.line(14, 32, 196, 32);

  // Forensic Report Title
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text('CERTIFIED REVENUE DIVERSION LOG', 14, 45);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Incident ID: ${violation.id.toUpperCase()}`, 14, 52);
  doc.text(`Certified On: ${timestamp}`, 14, 57);

  // Forensic Audit Table
  autoTable(doc, {
    startY: 65,
    head: [['FORENSIC FIELD', 'AUDIT DATA']],
    body: [
      ['IDENTIFIED TARGET', violation.brandName],
      ['FINAL DESTINATION', violation.pirateUrl],
      ['TELEMETRY SOURCE', violation.source || 'Heuristic Engine'],
      ['INCIDENT TIMESTAMP', violation.timestamp],
    ],
    theme: 'striped',
    headStyles: { fillColor: [40, 40, 40], fontSize: 10 }, 
    styles: { fontSize: 9, cellPadding: 4, overflow: 'linebreak' },
    columnStyles: { 
      0: { cellWidth: 50, fontStyle: 'bold', textColor: [80, 80, 80] },
      1: { cellWidth: 'auto' }
    },
    margin: { left: 14, right: 14 },
  });

  let currentY = (doc as any).lastAutoTable.finalY + 15;

  // Helper to convert Firebase Token URLs to Base64
  const getBase64FromUrl = async (url: string): Promise<string | null> => {
    if (!url) return null;
    try {
      console.log(`[PDF-GEN] Attempting to resolve cloud asset: ${url}`);
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'image/png,image/jpeg,image/*',
        },
      });

      if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
      
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => resolve(null);
      });
    } catch (e) {
      console.error(`[PDF-GEN] ❌ Resolution failed for ${url}:`, e);
      return null;
    }
  };

  // Forensic Visual Evidence Mapping
  const addForensicImage = async (imgUrl: string | undefined, label: string, yPos: number): Promise<number> => {
    if (!imgUrl) return yPos;
    
    if (yPos > 190) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(label, 14, yPos);
    
    try {
      const base64 = await getBase64FromUrl(imgUrl);
      if (!base64) throw new Error("Base64 resolution failed");

      const img = new Image();
      img.src = base64;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const targetWidth = 182; 
      const aspectRatio = img.naturalHeight / img.naturalWidth;
      const targetHeight = targetWidth * aspectRatio;
      const xPos = (pageWidth - targetWidth) / 2;
      
      doc.addImage(img, 'PNG', xPos, yPos + 5, targetWidth, targetHeight);
      return yPos + targetHeight + 20; 
    } catch (e) {
      doc.setFontSize(10);
      doc.setTextColor(150, 0, 0);
      doc.setFont('helvetica', 'normal');
      doc.text('[FORENSIC CAPTURE ERROR: CLOUD ASSET UNRESOLVED OR ACCESS DENIED]', 14, yPos + 10);
      return yPos + 20;
    }
  };

  // Phase Mapping
  currentY = await addForensicImage(violation.screenshot_source, 'Phase 1: Asset Ingestion (Origin)', currentY);
  currentY = await addForensicImage(violation.screenshot_tracker, 'Phase 2: Intermediary Hijack (Middleman)', currentY);
  currentY = await addForensicImage(violation.screenshot_destination, 'Phase 3: Brand Exploitation (Destination)', currentY);

  // Forensic Chain Data
  if (violation.redirectPath && violation.redirectPath.length > 0) {
    doc.addPage();
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('TELEMETRY REDIRECT CHAIN DATA', 14, 25);
    
    const pathData = violation.redirectPath.map((url, index) => {
      let label = 'Intermediary Node';
      if (index === 0) label = 'Origin (Asset Ingestion)';
      if (index === violation.redirectPath!.length - 1) {
        label = 'Target Destination';
        url = violation.pirateUrl || url;
      }
      if (url.includes('turnhub') || url.includes('tracking')) label = 'Revenue Diversion Node';
      return [label, url];
    });
    
    autoTable(doc, {
      startY: 35,
      head: [['NODE TYPE', 'URL']],
      body: pathData,
      theme: 'grid',
      headStyles: { fillColor: [80, 80, 80] },
      styles: { fontSize: 7, cellPadding: 2 },
      columnStyles: { 0: { cellWidth: 45 } }
    });
  }

  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('CONFIDENTIAL: AD-STRANGLE FORENSIC TELEMETRY DATA - PROPRIETARY', 105, 290, { align: 'center' });
  }

  doc.save(`AD_Forensic_Log_${violation.id.toUpperCase()}.pdf`);
};
