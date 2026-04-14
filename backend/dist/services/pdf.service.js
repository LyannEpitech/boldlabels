import { jsPDF } from 'jspdf';
// Convert mm to points (jsPDF uses points by default with unit: 'mm')
const MM_TO_PT = 2.83465;
export async function generateLabelPDF({ template, csvData, csvHeaders, mapping, pdfOptions, labelLayout, }) {
    const doc = new jsPDF({
        unit: 'mm',
        format: pdfOptions.pageSize.toLowerCase(),
        orientation: pdfOptions.orientation,
    });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const availableWidth = pageWidth - pdfOptions.margins.left - pdfOptions.margins.right;
    const availableHeight = pageHeight - pdfOptions.margins.top - pdfOptions.margins.bottom;
    // Use template dimensions for label size, not calculated
    const labelWidth = template.width;
    const labelHeight = template.height;
    let currentRow = 0;
    let currentCol = 0;
    for (let i = 0; i < csvData.length; i++) {
        const row = csvData[i];
        // Check if we need a new page
        if (currentRow >= labelLayout.labelsPerColumn) {
            doc.addPage();
            currentRow = 0;
            currentCol = 0;
        }
        const x = pdfOptions.margins.left + currentCol * (labelWidth + labelLayout.horizontalSpacing);
        const y = pdfOptions.margins.top + currentRow * (labelHeight + labelLayout.verticalSpacing);
        // Draw label background
        doc.setFillColor(template.backgroundColor);
        doc.rect(x, y, labelWidth, labelHeight, 'F');
        // Draw label border
        if (template.borderWidth > 0) {
            doc.setDrawColor(template.borderColor);
            doc.setLineWidth(template.borderWidth);
            doc.rect(x, y, labelWidth, labelHeight, 'S');
        }
        // Draw elements
        for (const element of template.elements) {
            const columnName = mapping[element.variableName];
            let value = element.variableName;
            if (columnName) {
                const colIndex = csvHeaders.indexOf(columnName);
                if (colIndex !== -1) {
                    value = row[colIndex] || '';
                }
            }
            // Element position relative to label
            const elX = x + element.x;
            const elY = y + element.y;
            // Parse properties (handle both string and object)
            let props = {};
            try {
                props = typeof element.properties === 'string'
                    ? JSON.parse(element.properties)
                    : element.properties || {};
            }
            catch (e) {
                props = {};
            }
            if (element.type === 'text') {
                doc.setFont(props.fontFamily || 'helvetica');
                // Convert fontSize from pt to mm (jsPDF uses mm with our config)
                const fontSizeMm = (props.fontSize || 12) / 2.83465;
                doc.setFontSize(fontSizeMm);
                doc.setTextColor(props.color || '#000000');
                const align = props.align || 'left';
                const textX = align === 'center' ? elX + (element.width || 50) / 2 :
                    align === 'right' ? elX + (element.width || 50) : elX;
                // Offset Y to align with preview (jsPDF positions from baseline)
                const baselineOffset = fontSizeMm * 0.35;
                doc.text(String(value), textX, elY + baselineOffset, {
                    align: align,
                    maxWidth: element.width || 50,
                });
            }
            else if (element.type === 'barcode') {
                // Draw barcode placeholder with value
                doc.setDrawColor(props.lineColor || '#000000');
                doc.setFillColor(props.backgroundColor || '#FFFFFF');
                doc.rect(elX, elY, element.width || 40, element.height || 20, 'FD');
                doc.setFont('helvetica');
                doc.setFontSize(8);
                doc.setTextColor(props.lineColor || '#000000');
                doc.text(String(value).substring(0, 20), elX + 2, elY + (element.height || 20) / 2);
                // Note: Real barcode generation would require a barcode library
                // For now, we display the value as text
            }
            else if (element.type === 'qrcode') {
                // Draw QR placeholder
                doc.setDrawColor(props.color || '#000000');
                doc.setFillColor(props.backgroundColor || '#FFFFFF');
                doc.rect(elX, elY, element.width || 30, element.height || 30, 'FD');
                doc.setFontSize(6);
                doc.setTextColor(props.color || '#000000');
                doc.text('QR', elX + (element.width || 30) / 2 - 3, elY + (element.height || 30) / 2);
            }
            else if (element.type === 'rectangle') {
                doc.setDrawColor(props.strokeColor || '#000000');
                doc.setFillColor(props.fillColor || 'transparent');
                doc.setLineWidth(props.strokeWidth || 1);
                if (props.fillColor && props.fillColor !== 'transparent') {
                    doc.rect(elX, elY, element.width || 20, element.height || 10, 'FD');
                }
                else {
                    doc.rect(elX, elY, element.width || 20, element.height || 10, 'S');
                }
            }
            else if (element.type === 'image') {
                // Image placeholder
                doc.setDrawColor('#CCCCCC');
                doc.rect(elX, elY, element.width || 30, element.height || 30, 'S');
                doc.setFontSize(8);
                doc.setTextColor('#999999');
                doc.text('IMG', elX + (element.width || 30) / 2 - 5, elY + (element.height || 30) / 2);
            }
        }
        currentCol++;
        if (currentCol >= labelLayout.labelsPerRow) {
            currentCol = 0;
            currentRow++;
        }
    }
    return Buffer.from(doc.output('arraybuffer'));
}
