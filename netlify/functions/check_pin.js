exports.handler = async (event) => {
    const secretPin = process.env.SCRIPT_PIN;
    const { pin } = JSON.parse(event.body);
    
    // Ini adalah baris debugging baru
    console.log('Secret PIN from env:', secretPin);
    console.log('PIN from user input:', pin);
    
    if (pin === secretPin) {
        return {
            statusCode: 200,
            body: JSON.stringify({ message: "PIN is correct." }),
        };
    } else {
        return {
            statusCode: 401,
            body: JSON.stringify({ message: "Incorrect PIN." }),
        };
    }
};