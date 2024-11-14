document.addEventListener("DOMContentLoaded", function () {
    let workflowData;

    // Handle file upload
    function handleFileUpload(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
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

    // Render graph based on the workflow data
    function renderGraph(data) {
        const graphContainer = d3.select("#graph");
        graphContainer.html(""); // Clear previous graph
        const height = 1500;

        const gap = 50;  // Gap between nodes
        const rectangleWidth = 250;  // Fixed width for each rectangle
        let totalWidth = 0;

        // Calculate the total width of all tasks
        data.workflowTasks.forEach(task => {
            const taskWidth = rectangleWidth;  // Fixed width of the rectangle
            totalWidth += taskWidth + gap;  // Add width of each task plus gap
        });

        // Add extra space at the end for visual padding
        totalWidth += 300;  // You can adjust this value as needed

        // Create the SVG element with dynamic width
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

        // Initialize taskMap with tasks and empty children arrays
        tasks.forEach(task => {
            taskMap[task.taskId] = { ...task, children: [] };
        });

        // Avoid circular dependencies
        const processedTasks = new Set();

        // Process task dependencies and avoid circular relationships
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

            // Mark the task as processed
            processedTasks.add(task.taskId);
        });

        // Find the root task (no prev task)
        const rootTask = tasks.find(task => !task.prev || task.prev.length === 0);
        if (!rootTask) {
            console.error("No root task found in the workflow data");
            return;
        }

        const root = d3.hierarchy(taskMap[rootTask.taskId]);
        root.x0 = height / 2;
        root.y0 = 0;

        const treeLayout = d3.tree().size([height - 200, totalWidth - 300]).separation(() => 1.5); // Increase separation for spacing

        // Apply the tree layout to the root node
        treeLayout(root);

        // Add the arrow marker for link paths
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
            .attr("fill", "#3498db");  // Arrow color

        // Update the tree diagram
        update(root);

        function update(source) {
            const nodes = root.descendants();
            const links = root.links();

            nodes.forEach(d => d.y = d.depth * 300);  // Adjust node spacing

            // Create nodes
            const node = svg.selectAll("g.node")
                .data(nodes, d => d.data.taskId);

            const nodeEnter = node.enter().append("g")
                .attr("class", "node")
                .attr("transform", d => `translate(${source.y0},${source.x0})`);

            // Create rectangles for nodes
            nodeEnter.append("rect")
                .attr("width", rectangleWidth)  // Fixed width of 250px
                .attr("height", 60)  // Fixed height of 60px
                .attr("fill", "transparent")
                .attr("stroke", d => getNodeColor(d))
                .attr("stroke-width", 2)
                .attr("rx", 10)  // Rounded corners
                .attr("ry", 10);

            // Add text inside nodes using foreignObject for wrapping
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
                    return `${d.data.taskId}: ${d.data.type}`;  // Concatenate taskId and type here
                });

            const nodeUpdate = nodeEnter.merge(node);

            nodeUpdate.transition()
                .duration(200)
                .attr("transform", d => `translate(${d.y},${d.x})`);

            nodeUpdate.select("rect")
                .attr("width", rectangleWidth)
                .attr("height", 60);

            node.exit().transition()
                .duration(200)
                .attr("transform", d => `translate(${source.y},${source.x})`)
                .remove();

            // Create links (arrows)
            const link = svg.selectAll("path.link")
                .data(links, d => d.target.data.taskId);

            link.enter().insert("path", "g")
                .attr("class", d => `link ${getLinkClass(d)}`)
                .attr("d", d => generateLinkPath(d))  // Custom function to generate link paths
                .attr("stroke-width", 2)
                .attr("fill", "none")
                .attr("marker-end", "url(#arrow)")  // Attach the arrow at the end of the path
                .merge(link)
                .transition()
                .duration(200)
                .attr("d", d => generateLinkPath(d));

            link.exit().transition()
                .duration(200)
                .attr("d", d => generateLinkPath(d))
                .remove();

            // Add labels to links (aligned over the line)
            const linkLabels = svg.selectAll("text.link-label")
                .data(links, d => d.target.data.taskId);

            linkLabels.enter().append("text")
                .attr("class", "link-label")
                .attr("x", function(d) {
                    // Get midpoint between source and target for X coordinate
                    return (d.source.y + d.target.y + 230) / 2;
                })
                .attr("y", function(d) {
                    // Get midpoint between source and target for Y coordinate
                    return (d.source.x + d.target.x + 100) / 2;
                })
                .attr("dx", 0) 
                .attr("dy", 0)  // Vertical offset to avoid overlap with rectangles
                .attr("text-anchor", "right")
                .style("font-size", "10px")  // Smaller font size
                .text(function(d) {
                    // Check whether it's nextOnSuccess or nextOnFailure
                    if (d.source.data.nextOnSuccess && d.source.data.nextOnSuccess.includes(d.target.data.taskId)) {
                        return "Success";
                    }
                    if (d.source.data.nextOnFailure && d.source.data.nextOnFailure.includes(d.target.data.taskId)) {
                        return "Failure";
                    }
                    return "";  // Default case
                });
        }

        // Function to generate the link path between two nodes
        function generateLinkPath(d) {
            const source = d.source;
            const target = d.target;
            const sourceX = source.y + rectangleWidth / 2;
            const sourceY = source.x + 30;
            const targetX = target.y - rectangleWidth / 2;
            const targetY = target.x + 30;
            return `M${sourceX},${sourceY} C${(sourceX + targetX) / 2},${sourceY} ${(sourceX + targetX) / 2},${targetY} ${targetX},${targetY}`;
        }

        // Function to determine the color of the node based on type
        function getNodeColor(d) {
            switch (d.data.type) {
                case "start":
                    return "green";
                case "end":
                    return "red";
                default:
                    return "blue";
            }
        }

        // Function to determine the link class based on nextOnSuccess or nextOnFailure
        function getLinkClass(d) {
            return d.source.data.nextOnSuccess && d.source.data.nextOnSuccess.includes(d.target.data.taskId) ? "success-link" :
                   d.source.data.nextOnFailure && d.source.data.nextOnFailure.includes(d.target.data.taskId) ? "failure-link" :
                   "default-link";
        }

        // Download SVG as file
        document.getElementById("download-svg").addEventListener("click", function() {
            const svgElement = document.querySelector("svg");
            const svgData = new XMLSerializer().serializeToString(svgElement);
            const blob = new Blob([svgData], { type: "image/svg+xml" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = "workflow.svg";
            link.click();
        });

        // Download workflow data as JSON
        document.getElementById("download-workflow").addEventListener("click", function() {
            const blob = new Blob([JSON.stringify(workflowData)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = "workflow.json";
            link.click();
        });
    }

    // Listen for file upload
    document.getElementById("file-input").addEventListener("change", handleFileUpload);
});
