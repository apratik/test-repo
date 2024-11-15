function downloadPNG() {
    const svgElement = document.querySelector("svg");
    
    // Serialize the SVG to a string
    const svgData = new XMLSerializer().serializeToString(svgElement);

    // Create a Blob for the SVG data
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });

    // Create an object URL from the Blob
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.crossOrigin = "anonymous"; // Avoid CORS issues for embedded data
    img.onload = function () {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        // Set canvas size to match SVG dimensions
        const width = svgElement.width.baseVal.value || 800; // Fallback width
        const height = svgElement.height.baseVal.value || 600; // Fallback height
        canvas.width = width;
        canvas.height = height;

        // Draw the image on the canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Convert canvas to PNG data URL
        const pngData = canvas.toDataURL("image/png");

        // Trigger download
        const link = document.createElement("a");
        link.href = pngData;
        link.download = "workflow.png";
        document.body.appendChild(link); // Required for Firefox
        link.click();
        document.body.removeChild(link);

        // Cleanup object URL
        URL.revokeObjectURL(url);
    };

    img.onerror = function (err) {
        console.error("Failed to load the image", err);
        alert("There was an issue processing the SVG. Ensure all resources are inlined.");
    };

    img.src = url; // Set the image source to the Blob URL
}
