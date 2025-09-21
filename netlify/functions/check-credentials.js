exports.handler = async (event) => {
    const adminUsername = process.env.ADMIN_USERNAME;
    const adminPassword = process.env.ADMIN_PASSWORD;

    const { username, password } = JSON.parse(event.body);

    if (username === adminUsername && password === adminPassword) {
        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Login successful!" }),
        };
    } else {
        return {
            statusCode: 401,
            body: JSON.stringify({ message: "Invalid credentials." }),
        };
    }
};