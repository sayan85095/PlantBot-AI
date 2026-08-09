import jsPDF from 'jspdf';

export const generateDiagnosticPDF = (result) => {
  if (!result) return;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  let y = 20;

  // Colors
  const primaryGreen = '#059669'; // Emerald 600
  const darkSlate = '#0f172a';   // Slate 900
  const lightBg = '#f8fafc';     // Slate 50
  const textGray = '#475569';     // Slate 600

  // Header Banner
  doc.setFillColor(primaryGreen);
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Header Text
  doc.setTextColor('#ffffff');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('PlantBot AI', margin, 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Agricultural Plant Disease Diagnostic Report', margin, 21);
  doc.text(`Date: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, pageWidth - margin - 50, 21);

  y = 38;

  // Diagnostic Summary Box
  doc.setFillColor(lightBg);
  doc.setDrawColor('#cbd5e1');
  doc.roundedRect(margin, y, pageWidth - (margin * 2), 40, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(darkSlate);
  doc.text('TensorFlow Computer Vision Classification Summary', margin + 5, y + 8);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textGray);

  doc.text(`Plant Species:`, margin + 5, y + 18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(darkSlate);
  doc.text(`${result.plant}`, margin + 35, y + 18);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textGray);
  doc.text(`Diagnosis:`, margin + 5, y + 26);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryGreen);
  doc.text(`${result.disease}`, margin + 35, y + 26);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textGray);
  doc.text(`Health Status:`, margin + 110, y + 18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(result.status === 'Healthy' ? '#10b981' : '#e11d48');
  doc.text(`${result.status}`, margin + 140, y + 18);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textGray);
  doc.text(`AI Confidence:`, margin + 110, y + 26);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(darkSlate);
  doc.text(`${result.confidence}%`, margin + 140, y + 26);

  y += 50;

  // Gemma 3 AI Analysis Section
  if (result.ai_analysis) {
    const ai = result.ai_analysis;

    // Overview
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(darkSlate);
    doc.text('Gemma 3 AI Agronomic Analysis', margin, y);
    y += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(textGray);

    const descLines = doc.splitTextToSize(ai.description || '', pageWidth - (margin * 2));
    doc.text(descLines, margin, y);
    y += (descLines.length * 4.5) + 6;

    // Helper to render bullet sections
    const renderSection = (title, items, bulletColor = primaryGreen) => {
      if (!items || items.length === 0) return;

      if (y > 260) {
        doc.addPage();
        y = 20;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(darkSlate);
      doc.text(title, margin, y);
      y += 5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(textGray);

      items.forEach((item) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        const lines = doc.splitTextToSize(`• ${item}`, pageWidth - (margin * 2) - 5);
        doc.text(lines, margin + 3, y);
        y += (lines.length * 4) + 1.5;
      });

      y += 4;
    };

    renderSection('Key Symptoms', ai.symptoms);
    renderSection('Primary Causes', ai.causes);
    renderSection('Recommended Treatments (Organic & Chemical)', ai.treatment);
    renderSection('Prevention Best Practices', ai.prevention);
    renderSection('Plant Care Tips', ai.care_tips);
  }

  // Footer Disclaimer
  if (y > 265) {
    doc.addPage();
    y = 20;
  } else {
    y = Math.max(y + 10, 260);
  }

  doc.setDrawColor('#e2e8f0');
  doc.line(margin, y, pageWidth - margin, y);
  y += 5;

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor('#94a3b8');
  doc.text(
    'Disclaimer: PlantBot AI combines computer vision with local LLM reasoning. For severe outbreaks, consult a local agricultural extension officer.',
    margin,
    y
  );

  // Save / Download PDF file
  const fileName = `${result.plant}_${result.disease.replace(/\s+/g, '_')}_Report.pdf`;
  doc.save(fileName);
};
