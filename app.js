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

    // Render the graph as a force-directed layout
    function renderGraph() {
        d3.select("#graph").html(""); // Clear the graph
        const svg = d3.select("#graph").append("svg").attr("width", 800).attr("height", 600);

        // Map workflow data to nodes and links
        nodes = workflowData.workflowTasks.map(task => ({
            id: task.taskId,
            name: task.name,
            type: task.type,
            prev: task.prev,
            nextOnSuccess: task.nextOnSuccess,
            nextOnFailure: task.nextOnFailure,
        }));

        links = [];
        workflowData.workflowTasks.forEach(task => {
            if (task.nextOnSuccess) {
                task.nextOnSuccess.forEach(targetId => {
                    links.push({ source: task.taskId, target: targetId, type: "success" });
                });
            }
            if (task.nextOnFailure) {
                task.nextOnFailure.forEach(targetId => {
                    links.push({ source: task.taskId, target: targetId, type: "failure" });
                });
            }
        });

        // Force-directed graph simulation
        const simulation = d3.forceSimulation(nodes)
            .force("link", d3.forceLink(links).id(d => d.id).distance(100))
            .force("charge", d3.forceManyBody().strength(-200))
            .force("center", d3.forceCenter(400, 300));

        // Create links (arrows between nodes)
        const link = svg.selectAll(".link")
            .data(links)
            .enter().append("line")
            .attr("class", "link")
            .attr("stroke", d => d.type === "success" ? "green" : "red")
            .attr("stroke-width", 2);

        // Create nodes (task components)
        const node = svg.selectAll(".node")
            .data(nodes)
            .enter().append("g")
            .attr("class", "node")
            .call(d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended));

        node.append("rect")
            .attr("width", 120)
            .attr("height", 40)
            .attr("rx", 6)
            .attr("ry", 6)
            .attr("fill", "#3b8e8d");

        node.append("text")
            .attr("dy", ".35em")
            .attr("text-anchor", "middle")
            .attr("fill", "white")
            .text(d => `${d.name} (${d.type})`);

        // Add delete button for each node
        node.append("foreignObject")
            .attr("x", 50)
            .attr("y", -10)
            .attr("width", 20)
            .attr("height", 20)
            .append("xhtml:button")
            .text("Delete")
            .attr("class", "delete-button")
            .on("click", (event, d) => deleteNode(d));

        // Simulation tick function
        simulation.on("tick", () => {
            link.attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y);

            node.attr("transform", d => `translate(${d.x},${d.y})`);
        });

        // Drag functions
        function dragstarted(event, d) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }

        function dragged(event, d) {
            d.fx = event.x;
            d.fy = event.y;
        }

        function dragended(event, d) {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
        }

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
