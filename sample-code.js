// Function to download the PNG
function downloadPNG() {
    const svgElement = document.querySelector("svg");
    const svgData = new XMLSerializer().serializeToString(svgElement);
    
    // Create an image element and load the serialized SVG as its source
    const img = new Image();
    
    // Use a Blob to hold the SVG data and load it into the image
    const svgBlob = new Blob([svgData], {type: "image/svg+xml"});
    const url = URL.createObjectURL(svgBlob);
    
    img.onload = function() {
        // Create a canvas to draw the image
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        
        // Set the canvas size to match the SVG
        canvas.width = svgElement.width.baseVal.value;
        canvas.height = svgElement.height.baseVal.value;
        
        // Draw the image onto the canvas
        ctx.drawImage(img, 0, 0);
        
        // Create a link to download the canvas as a PNG
        const link = document.createElement("a");
        link.href = canvas.toDataURL("image/png");
        link.download = "workflow.png";
        
        // Trigger the download
        link.click();
        
        // Clean up the object URL
        URL.revokeObjectURL(url);
    };
    
    img.src = url; // Start loading the image
}
