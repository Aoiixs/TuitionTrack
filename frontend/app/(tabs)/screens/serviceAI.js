export const SendtoAI = async(message) =>{
    const response = await fetch(
        "http://192.168.1.8:8081/ai-chat",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                },
                
                body: JSON.stringify({message}),
            }
    );

    return await response.json();
};