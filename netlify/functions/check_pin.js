exports.handler = async (event) => {
    const secretPin = process.env.SCRIPT_PIN;
    const { pin } = JSON.parse(event.body);

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