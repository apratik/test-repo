// Function to download the workflow as a PNG
function downloadPNG() {
    const svgElement = document.querySelector("svg");
    const svgData = new XMLSerializer().serializeToString(svgElement);

    // Create a canvas element
    const canvas = document.createElement("canvas");
    const bbox = svgElement.getBoundingClientRect();
    canvas.width = bbox.width;
    canvas.height = bbox.height;

    const ctx = canvas.getContext("2d");

    // Create an image to render the SVG data
    const img = new Image();
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);

    img.onload = function () {
        // Draw the SVG image on the canvas
        ctx.drawImage(img, 0, 0);

        // Download the canvas as a PNG
        const link = document.createElement("a");
        link.href = canvas.toDataURL("image/png");
        link.download = "workflow.png";
        link.click();

        // Clean up the URL object
        URL.revokeObjectURL(url);
    };

    img.src = url;
}
