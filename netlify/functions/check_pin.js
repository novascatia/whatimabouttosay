exports.handler = async (event) => {
    try {
        const secretPin = process.env.SCRIPT_PIN;
        const { pin } = JSON.parse(event.body);

        // Langsung periksa apakah PIN rahasia ada
        if (!secretPin) {
            return {
                statusCode: 500,
                body: JSON.stringify({ error: "Secret PIN is not set in Netlify Environment Variables." }),
            };
        }

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
    } catch (error) {
        // Tangkap dan kirimkan error fatal ke browser
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Function crashed. Details: " + error.message }),
        };
    }
};