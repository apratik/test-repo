// Function to download the SVG
function downloadSVG() {
    const svgElement = document.querySelector("svg");

    // Set a white background for the SVG
    const svgNS = "http://www.w3.org/2000/svg";
    const background = document.createElementNS(svgNS, "rect");
    background.setAttribute("x", 0);
    background.setAttribute("y", 0);
    background.setAttribute("width", svgElement.getAttribute("width"));
    background.setAttribute("height", svgElement.getAttribute("height"));
    background.setAttribute("fill", "white");

    // Insert the background rect as the first child of the SVG
    svgElement.insertBefore(background, svgElement.firstChild);

    // Serialize the SVG
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const blob = new Blob([svgData], { type: "image/svg+xml" });

    // Create a link for downloading the SVG
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "workflow.svg";
    link.click();

    // Remove the white background rect after download to avoid altering the original SVG
    svgElement.removeChild(background);
}
