import { jsPDF } from 'jspdf';
const MM_TO_PT = 2.83465;
function withRotation(_doc, _element, _x, _y, callback) {
    // jsPDF doesn't support rotation for individual elements easily
    // Rotation is applied via transformation matrix in advanced usage
    // For now, we skip rotation in PDF output or apply it via coordinate transformation
    callback();
}
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
    const labelWidth = (availableWidth - (labelLayout.labelsPerRow - 1) * labelLayout.horizontalSpacing) / labelLayout.labelsPerRow;
    const labelHeight = (availableHeight - (labelLayout.labelsPerColumn - 1) * labelLayout.verticalSpacing) / labelLayout.labelsPerColumn;
    let currentRow = 0;
    let currentCol = 0;
    for (let i = 0; i < csvData.length; i++) {
        const row = csvData[i];
        // New page if needed
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
            await drawElement(doc, element, row, csvHeaders, mapping, x, y);
        }
        currentCol++;
        if (currentCol >= labelLayout.labelsPerRow) {
            currentCol = 0;
            currentRow++;
        }
    }
    return doc;
}
async function drawElement(doc, element, row, _csvHeaders, mapping, labelX, labelY) {
    const columnName = mapping[element.variableName];
    let value = element.variableName;
    console.log(`Element ${element.variableName}: columnName=${columnName}, csvHeaders=${_csvHeaders}`);
    if (columnName) {
        const colIndex = _csvHeaders.indexOf(columnName);
        console.log(`  -> colIndex=${colIndex}, row[${colIndex}]=${row[colIndex]}`);
        if (colIndex !== -1) {
            value = row[colIndex] || '';
        }
    }
    const elX = labelX + element.x;
    const elY = labelY + element.y;
    switch (element.type) {
        case 'text':
            drawTextElement(doc, element, value, elX, elY);
            break;
        case 'barcode':
            await drawBarcodeElement(doc, element, value, elX, elY);
            break;
        case 'qrcode':
            await drawQRCodeElement(doc, element, value, elX, elY);
            break;
        case 'image':
            await drawImageElement(doc, element, value, elX, elY);
            break;
        case 'rectangle':
            drawRectangleElement(doc, element, elX, elY);
            break;
    }
}
function drawTextElement(doc, element, value, x, y) {
    const props = element.properties;
    // Vérification défensive des propriétés
    if (!props) {
        console.warn(`Properties undefined for element ${element.variableName}`);
        return;
    }
    // Map font family
    const fontMap = {
        'Arial': 'helvetica',
        'Helvetica': 'helvetica',
        'Times New Roman': 'times',
        'Courier New': 'courier',
        'Georgia': 'times',
        'Verdana': 'helvetica',
    };
    const fontFamily = fontMap[props.fontFamily] || 'helvetica';
    const fontStyle = props.fontWeight === 'bold' && props.fontStyle === 'italic'
        ? 'bolditalic'
        : props.fontWeight === 'bold'
            ? 'bold'
            : props.fontStyle === 'italic'
                ? 'italic'
                : 'normal';
    doc.setFont(fontFamily, fontStyle);
    doc.setFontSize(props.fontSize || 12);
    // Parse color
    const color = props.color || '#000000';
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    doc.setTextColor(r, g, b);
    const align = props.align || 'left';
    const textX = align === 'center'
        ? x + element.width / 2
        : align === 'right'
            ? x + element.width
            : x;
    // Handle vertical align
    const textHeight = (props.fontSize || 12) * 0.35;
    const textY = props.verticalAlign === 'middle'
        ? y + element.height / 2 + textHeight / 2
        : props.verticalAlign === 'bottom'
            ? y + element.height - textHeight
            : y + textHeight;
    doc.text(value, textX, textY, {
        align: align,
        maxWidth: element.width,
    });
}
async function drawBarcodeElement(doc, element, value, x, y) {
    const props = element.properties;
    // Use JsBarcode to generate canvas
    const canvas = document.createElement('canvas');
    try {
        const JsBarcode = (await import('jsbarcode')).default;
        JsBarcode(canvas, value || '123456789012', {
            format: props.format || 'EAN13',
            width: 2,
            height: element.height * MM_TO_PT * 0.6,
            displayValue: props.displayValue !== false,
            fontSize: element.height * 2,
            lineColor: props.lineColor || '#000000',
            background: props.backgroundColor || '#FFFFFF',
            margin: 0,
        });
        const imgData = canvas.toDataURL('image/png');
        withRotation(doc, element, x, y, () => {
            doc.addImage(imgData, 'PNG', x, y, element.width, element.height);
        });
    }
    catch (e) {
        // Fallback: draw placeholder
        withRotation(doc, element, x, y, () => {
            doc.setDrawColor('#cccccc');
            doc.setFillColor('#f5f5f5');
            doc.rect(x, y, element.width, element.height, 'FD');
            doc.setTextColor('#999999');
            doc.setFontSize(8);
            doc.text('Invalid barcode', x + element.width / 2, y + element.height / 2, { align: 'center' });
        });
    }
}
async function drawQRCodeElement(doc, element, value, x, y) {
    const props = element.properties;
    try {
        const QRCode = await import('qrcode');
        const dataUrl = await QRCode.toDataURL(value || 'https://example.com', {
            width: 200,
            margin: 1,
            color: {
                dark: props.color || '#000000',
                light: props.backgroundColor || '#FFFFFF',
            },
            errorCorrectionLevel: (props.errorCorrectionLevel || 'M'),
        });
        withRotation(doc, element, x, y, () => {
            doc.addImage(dataUrl, 'PNG', x, y, element.width, element.height);
        });
    }
    catch (e) {
        // Fallback: draw placeholder
        withRotation(doc, element, x, y, () => {
            doc.setDrawColor('#cccccc');
            doc.setFillColor('#f5f5f5');
            doc.rect(x, y, element.width, element.height, 'FD');
            doc.setTextColor('#999999');
            doc.setFontSize(8);
            doc.text('Invalid QR', x + element.width / 2, y + element.height / 2, { align: 'center' });
        });
    }
}
async function drawImageElement(doc, element, value, x, y) {
    const props = element.properties;
    if (!props.src && !value) {
        // Draw placeholder
        withRotation(doc, element, x, y, () => {
            doc.setDrawColor('#cccccc');
            doc.setFillColor('#f5f5f5');
            doc.rect(x, y, element.width, element.height, 'FD');
            doc.setTextColor('#999999');
            doc.setFontSize(8);
            doc.text('No image', x + element.width / 2, y + element.height / 2, { align: 'center' });
        });
        return;
    }
    const src = value || props.src;
    try {
        // Check if it's a base64 image or URL
        if (src.startsWith('data:image')) {
            const format = src.includes('png') ? 'PNG' : 'JPEG';
            withRotation(doc, element, x, y, () => {
                doc.addImage(src, format, x, y, element.width, element.height);
            });
        }
        else if (src.startsWith('http')) {
            // For external URLs, we'd need to fetch and convert
            // For now, draw placeholder with URL
            withRotation(doc, element, x, y, () => {
                doc.setDrawColor('#cccccc');
                doc.rect(x, y, element.width, element.height, 'S');
                doc.setFontSize(6);
                doc.text('External image', x + 2, y + element.height / 2);
            });
        }
    }
    catch (e) {
        // Fallback
        withRotation(doc, element, x, y, () => {
            doc.setDrawColor('#ff0000');
            doc.setFillColor('#ffeeee');
            doc.rect(x, y, element.width, element.height, 'FD');
        });
    }
}
function drawRectangleElement(doc, element, x, y) {
    const props = element.properties;
    withRotation(doc, element, x, y, () => {
        // Parse fill color
        const fillColor = props.fillColor || 'transparent';
        if (fillColor !== 'transparent') {
            const r = parseInt(fillColor.slice(1, 3), 16);
            const g = parseInt(fillColor.slice(3, 5), 16);
            const b = parseInt(fillColor.slice(5, 7), 16);
            doc.setFillColor(r, g, b);
        }
        // Parse stroke color
        const strokeColor = props.strokeColor || '#000000';
        const sr = parseInt(strokeColor.slice(1, 3), 16);
        const sg = parseInt(strokeColor.slice(3, 5), 16);
        const sb = parseInt(strokeColor.slice(5, 7), 16);
        doc.setDrawColor(sr, sg, sb);
        doc.setLineWidth(props.strokeWidth || 1);
        if (fillColor !== 'transparent') {
            doc.rect(x, y, element.width, element.height, 'FD');
        }
        else {
            doc.rect(x, y, element.width, element.height, 'S');
        }
    });
}
//# sourceMappingURL=pdfGenerator.js.map