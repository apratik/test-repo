document.getElementById('jsonFileInput').addEventListener('change', handleFileUpload);

function handleFileUpload(event) {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const workflowData = JSON.parse(e.target.result);
            renderGraph(workflowData);
        } catch (error) {
            alert('Invalid JSON');
        }
    };
    reader.readAsText(file);
}

function renderGraph(data) {
    const svg = d3.select('#graph').html('').append('svg')
        .attr('width', '100%')
        .attr('height', '100%')
        .style('background', '#f4f4f9'); // Page background color

    const margin = { top: 20, right: 90, bottom: 30, left: 90 };
    const width = 1200 - margin.left - margin.right;
    const height = 800 - margin.top - margin.bottom;

    const g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const root = d3.hierarchy(data, d => d.workFlowTasks)
        .sort((a, b) => d3.ascending(a.data.name, b.data.name));

    const treeLayout = d3.tree().size([height, width]);
    treeLayout(root);

    const link = g.selectAll(".link")
        .data(root.links())
        .enter().append("path")
        .attr("class", "link")
        .attr("d", d3.linkHorizontal()
            .x(d => d.y)
            .y(d => d.x))
        .attr("stroke", d => d.target.data.nextOnFailure ? "red" : "green") // Green for success, red for failure
        .attr("fill", "none");

    const node = g.selectAll(".node")
        .data(root.descendants())
        .enter().append("g")
        .attr("class", "node")
        .attr("transform", d => `translate(${d.y},${d.x})`)
        .on("click", (event, d) => {
            if (d.children) {
                d._children = d.children;
                d.children = null;
            } else {
                d.children = d._children;
                d._children = null;
            }
            renderGraph(data); // Re-render graph to update view on click
        });

    node.append("rect")
        .attr("width", 150)
        .attr("height", 60)
        .attr("y", -30)
        .attr("x", -75)
        .attr("fill", d => d.data.type === 'START' ? '#d1e7dd' : '#fff')
        .attr("stroke", "#555");

    node.append("text")
        .attr("dy", 4)
        .attr("text-anchor", "middle")
        .text(d => d.data.type) // Show component type as node label
        .style("fill", "#333") // Font color
        .style("font-size", "12px")
        .style("pointer-events", "none"); // Prevents text from triggering collapse

    node.append("text")
        .attr("dy", 18)
        .attr("text-anchor", "middle")
        .text(d => d.data.name) // Show task name under component
        .style("font-size", "10px")
        .style("fill", "#333");

    node.append("title")
        .text(d => d.data.name); // Tooltip for task name
}

// Export to SVG file
document.getElementById('downloadGraphButton').addEventListener('click', function () {
    const svgElement = document.querySelector('svg');
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgElement);
    const svgBlob = new Blob([svgString], { type: "image/svg+xml" });
    const url = URL.createObjectURL(svgBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'workflow_graph.svg';
    a.click();
    URL.revokeObjectURL(url);
});

// Copy Workflow JSON to Clipboard
document.getElementById('copyJsonButton').addEventListener('click', function () {
    const workflowJson = JSON.stringify(workflowData, null, 2);
    navigator.clipboard.writeText(workflowJson).then(function () {
        alert('Workflow JSON copied to clipboard!');
    }, function (err) {
        alert('Failed to copy text: ', err);
    });
});
