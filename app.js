document.addEventListener("DOMContentLoaded", function () {
    let workflowData = { workflowTasks: [] };
    let nodes = [];
    let links = [];

    // Event Listeners for buttons and file input
    document.getElementById("jsonFileInput").addEventListener("change", handleFileUpload);
    document.getElementById("exportButton").addEventListener("click", exportWorkflow);
    document.getElementById("downloadGraphButton").addEventListener("click", downloadGraph);
    document.getElementById("copyJsonButton").addEventListener("click", copyWorkflowJSON);
    document.getElementById("addNewComponentButton").addEventListener("click", addNewComponentType);

    // Handle file upload
    function handleFileUpload(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                workflowData = JSON.parse(e.target.result);
                generateComponentPanel();
                renderGraph();
            };
            reader.readAsText(file);
        }
    }

    // Generate Component Panel with buttons for each component type
    function generateComponentPanel() {
        const uniqueTypes = Array.from(new Set(workflowData.workflowTasks.map(task => task.type)));
        const componentButtons = document.getElementById("componentButtons");
        componentButtons.innerHTML = "";

        uniqueTypes.forEach(type => {
            createComponentButton(type);
        });
    }

    // Create a button for each component type
    function createComponentButton(type) {
        const componentButtons = document.getElementById("componentButtons");

        const btn = document.createElement("button");
        btn.className = "component-button";
        btn.textContent = type;
        btn.addEventListener("click", () => addComponent(type));
        componentButtons.appendChild(btn);
    }

    // Add new component type
    function addNewComponentType() {
        const newTypeInput = document.getElementById("newComponentInput");
        const newType = newTypeInput.value.trim();

        if (newType && !workflowData.workflowTasks.some(task => task.type === newType)) {
            createComponentButton(newType);
            newTypeInput.value = "";
        } else {
            alert("Type already exists or input is empty.");
        }
    }

    // Render the graph as a static flowchart
    function renderGraph() {
        d3.select("#graph").html("");
        const svg = d3.select("#graph").append("svg").attr("width", 800).attr("height", 600);

        // Build the hierarchy from the workflowData
        const root = d3.stratify()
            .id(d => d.taskId)
            .parentId(d => d.prev)(workflowData.workflowTasks);

        const treeLayout = d3.tree().size([700, 400]);
        treeLayout(root);

        // Links (arrows between nodes)
        const link = svg.selectAll(".link")
            .data(root.links())
            .enter().append("line")
            .attr("class", "link")
            .attr("stroke", d => d.type === "success" ? "green" : "red")
            .attr("stroke-width", 2);

        // Nodes (task components)
        const node = svg.selectAll(".node")
            .data(root.descendants())
            .enter().append("g")
            .attr("class", "node")
            .attr("transform", d => `translate(${d.x},${d.y})`)
            .on("click", (event, d) => deleteNode(d));

        node.append("rect")
            .attr("width", 120)
            .attr("height", 40)
            .attr("rx", 6)
            .attr("ry", 6)
            .attr("fill", d => d.parent === null ? "blue" : (d.children ? "#3b8e8d" : "darkred"));

        node.append("text")
            .attr("dy", ".35em")
            .attr("text-anchor", "middle")
            .attr("fill", "white")
            .text(d => `${d.data.name} (${d.data.type})`);

        node.append("foreignObject")
            .attr("x", 50)
            .attr("y", -10)
            .attr("width", 20)
            .attr("height", 20)
            .append("xhtml:button")
            .text("Delete")
            .attr("class", "delete-button")
            .on("click", (event, d) => deleteNode(d));

        // Links (arrows) between nodes
        links.forEach(function (link) {
            svg.append("line")
                .attr("x1", link.source.x)
                .attr("y1", link.source.y)
                .attr("x2", link.target.x)
                .attr("y2", link.target.y)
                .attr("stroke", link.type === "success" ? "green" : "red")
                .attr("stroke-width", 2);
        });

        // Delete node functionality
        function deleteNode(node) {
            workflowData.workflowTasks = workflowData.workflowTasks.filter(task => task.taskId !== node.id);
            nodes = nodes.filter(n => n.id !== node.id);
            links = links.filter(link => link.source.id !== node.id && link.target.id !== node.id);
            renderGraph();
        }
    }

    // Add a new component to the workflow
    function addComponent(type) {
        const newId = `task_${nodes.length + 1}`;
        workflowData.workflowTasks.push({ taskId: newId, type: type, prev: null, nextOnSuccess: [], nextOnFailure: [] });
        nodes.push({ id: newId, type: type });
        renderGraph();
    }

    // Export the workflow as a JSON file
    function exportWorkflow() {
        const blob = new Blob([JSON.stringify(workflowData, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "updated_workflow.json";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    // Download the graph as an SVG file
    function downloadGraph() {
        const svgData = new XMLSerializer().serializeToString(d3.select("svg").node());
        const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
        const url = URL.createObjectURL(svgBlob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "workflow_visualization.svg";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    // Copy workflow JSON to clipboard
    function copyWorkflowJSON() {
        navigator.clipboard.writeText(JSON.stringify(workflowData, null, 2))
            .then(() => alert("Workflow JSON copied to clipboard"));
    }
});
