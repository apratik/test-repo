if (d.source.data.nextOnSuccess && d.source.data.nextOnSuccess.includes(d.target.data.taskId)) {
    // Check if type is DECISION
    if (d.source.data.type === "DECISION") {
        // Check if more than one element exists in nextOnSuccess
        if (d.source.data.nextOnSuccess.length > 1) {
            const index = d.source.data.nextOnSuccess.indexOf(d.target.data.taskId);
            if (index === 0) {
                // First element gets "Success:if"
                return "Success:if";
            } else {
                // All subsequent elements get "Success:else"
                return "Success:else";
            }
        }
    }
    // If not DECISION or only one element, return regular "Success"
    return "Success";
} else if (d.source.data.nextOnFailure && d.source.data.nextOnFailure.includes(d.target.data.taskId)) {
    // If taskId is in nextOnFailure, return "Error"
    return "Error";
}

return ""; // Default case
