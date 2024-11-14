document.addEventListener("DOMContentLoaded", function () {
    let workflowData;

    // Handle file upload
    function handleFileUpload(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                try {
                    workflowData = JSON.parse(e.target.result);
                    renderGraph(workflowData);
                } catch (error) {
                    console.error("Invalid JSON format");
                }
            };
            reader.readAsText(file);
        }
    }

    // Function to download SVG
    function downloadSVG() {
        const svgElement = document.querySelector("#graph svg");
        if (!svgElement) return;

        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(svgElement);
        const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = "workflow_diagram.svg";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    // Function to copy workflow JSON to clipboard
    function copyWorkflow() {
        if (!workflowData) return;

        navigator.clipboard.writeText(JSON.stringify(workflowData, null, 2))
            .then(() => alert("Workflow JSON copied to clipboard!"))
            .catch(err => console.error("Failed to copy JSON:", err));
    }

    // Render graph based on the workflow data
    function renderGraph(data) {
        const graphContainer = d3.select("#graph");
        graphContainer.html(""); // Clear previous graph
        const height = 1500;

        const gap = 50;
        const rectangleWidth = 250;
        let totalWidth = 0;

        data.workflowTasks.forEach(task => {
            const taskWidth = rectangleWidth;
            totalWidth += taskWidth + gap;
        });

        totalWidth += 300;

        const svg = graphContainer
            .append("svg")
            .attr("width", totalWidth)
            .attr("height", height)
            .append("g")
            .attr("transform", "translate(100, 50)");

        if (!data || !data.workflowTasks) {
            console.error("Invalid workflow data format");
            return;
        }

        const tasks = data.workflowTasks;
        const taskMap = {};

        tasks.forEach(task => {
            taskMap[task.taskId] = { ...task, children: [] };
        });

        const processedTasks = new Set();

        tasks.forEach(task => {
            if (task.prev && Array.isArray(task.prev)) {
                task.prev.forEach(prevTaskId => {
                    if (taskMap[prevTaskId] && !processedTasks.has(prevTaskId)) {
                        taskMap[prevTaskId].children.push(taskMap[task.taskId]);
                    }
                });
            }

            if (task.nextOnSuccess && Array.isArray(task.nextOnSuccess)) {
                task.nextOnSuccess.forEach(nextTaskId => {
                    if (taskMap[nextTaskId] && !processedTasks.has(nextTaskId)) {
                        taskMap[task.taskId].children.push(taskMap[nextTaskId]);
                    }
                });
            }

            if (task.nextOnFailure && Array.isArray(task.nextOnFailure)) {
                task.nextOnFailure.forEach(nextTaskId => {
                    if (taskMap[nextTaskId] && !processedTasks.has(nextTaskId)) {
                        taskMap[task.taskId].children.push(taskMap[nextTaskId]);
                    }
                });
            }

            processedTasks.add(task.taskId);
        });

        const rootTask = tasks.find(task => !task.prev || task.prev.length === 0);
        if (!rootTask) {
            console.error("No root task found in the workflow data");
            return;
        }

        const root = d3.hierarchy(taskMap[rootTask.taskId]);
        root.x0 = height / 2;
        root.y0 = 0;

        const treeLayout = d3.tree().size([height - 200, totalWidth - 300]).separation(() => 1.5);
        treeLayout(root);

        svg.append("defs").append("marker")
            .attr("id", "arrow")
            .attr("viewBox", "0 -5 10 10")
            .attr("refX", 15)
            .attr("refY", 0)
            .attr("markerWidth", 6)
            .attr("markerHeight", 6)
            .attr("orient", "auto")
            .append("path")
            .attr("d", "M0,-5L10,0L0,5")
            .attr("fill", "#3498db");

        update(root);

        function update(source) {
            const nodes = root.descendants();
            const links = root.links();

            nodes.forEach(d => d.y = d.depth * 300);

            const node = svg.selectAll("g.node")
                .data(nodes, d => d.data.taskId);

            const nodeEnter = node.enter().append("g")
                .attr("class", "node")
                .attr("transform", d => `translate(${source.y0},${source.x0})`);

            nodeEnter.append("rect")
                .attr("width", rectangleWidth)
                .attr("height", 60)
                .attr("fill", "transparent")
                .attr("stroke", d => getNodeColor(d))
                .attr("stroke-width", 2)
                .attr("rx", 10)
                .attr("ry", 10);

            nodeEnter.append("foreignObject")
                .attr("x", 0)
                .attr("y", 0)
                .attr("width", rectangleWidth)
                .attr("height", 60)
                .append("xhtml:div")
                .attr("style", "width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;")
                .append("div")
                .attr("style", "text-align: center; white-space: normal; font-size: 12px;")
                .text(function(d) {
                    return `${d.data.taskId}: ${d.data.type}`;
                });

            const nodeUpdate = nodeEnter.merge(node);
            nodeUpdate.transition()
                .duration(200)
                .attr("transform", d => `translate(${d.y},${d.x})`);

            const link = svg.selectAll("path.link")
                .data(links, d => d.target.data.taskId);

            link.enter().insert("path", "g")
                .attr("class", d => `link ${getLinkClass(d)}`)
                .attr("d", d => generateLinkPath(d))
                .attr("stroke-width", 2)
                .attr("fill", "none")
                .attr("marker-end", "url(#arrow)");

            const linkLabels = svg.selectAll("text.link-label")
                .data(links, d => d.target.data.taskId);

            linkLabels.enter().append("text")
                .attr("class", "link-label")
                .attr("x", function(d) {
                    return (d.source.y + d.target.y + 230) / 2;
                })
                .attr("y", function(d) {
                    return (d.source.x + d.target.x + 100) / 2;
                })
                .attr("dx", 0)
                .attr("dy", 0)
                .style("font-size", "10px")
                .text(function(d) {
                    if (d.source.data.nextOnSuccess && d.source.data.nextOnSuccess.includes(d.target.data.taskId)) {
                        return "Success";
                    }
                    if (d.source.data.nextOnFailure && d.source.data.nextOnFailure.includes(d.target.data.taskId)) {
                        return "Failure";
                    }
                });
        }
    }

    document.getElementById("jsonFileInput").addEventListener("change", handleFileUpload);
    document.getElementById("downloadSVG").addEventListener("click", downloadSVG);
    document.getElementById("copyWorkflow").addEventListener("click", copyWorkflow);
});
