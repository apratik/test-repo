function downloadPNG() {
    const svgElement = document.querySelector("svg");

    // Serialize SVG with inline styles
    const svgWithStyles = serializeSVGWithStyles(svgElement);

    // Create a canvas to render the SVG
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    // Set canvas size based on SVG dimensions
    const { width, height } = svgElement.getBBox();
    canvas.width = width;
    canvas.height = height;

    // Create an image from the SVG
    const img = new Image();
    img.onload = function () {
        // Draw the SVG onto the canvas
        context.drawImage(img, 0, 0);
        // Export the canvas as a PNG
        const pngData = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.href = pngData;
        link.download = "workflow.png";
        link.click();
    };

    // Handle cross-origin issues by using a data URL
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgWithStyles)}`;
}

// Function to inline styles into the SVG
function serializeSVGWithStyles(svg) {
    // Clone the SVG to avoid modifying the original
    const clone = svg.cloneNode(true);

    // Get all applied styles from stylesheets
    const styleSheets = Array.from(document.styleSheets);
    const styleText = [];

    styleSheets.forEach(sheet => {
        try {
            if (sheet.cssRules) {
                Array.from(sheet.cssRules).forEach(rule => {
                    styleText.push(rule.cssText);
                });
            }
        } catch (e) {
            console.warn("Could not access CSS rules for stylesheet", sheet, e);
        }
    });

    // Create a <style> element and append it to the SVG
    const styleElement = document.createElement("style");
    styleElement.textContent = styleText.join("\n");
    clone.insertBefore(styleElement, clone.firstChild);

    // Serialize the SVG to a string
    const serializer = new XMLSerializer();
    return serializer.serializeToString(clone);
}
