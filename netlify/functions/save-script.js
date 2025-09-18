const { Octokit } = require("@octokit/core");

// Gunakan token GitHub dari Environment Variable Netlify
// PENTING: Jangan masukkan token langsung di kode!
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

exports.handler = async (event) => {
    try {
        const { content } = JSON.parse(event.body);

        if (!content) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "Content is required." }),
            };
        }

        const gistResponse = await octokit.request('POST /gists', {
            description: `Script uploaded via novascatia.my.id`,
            public: true, // Ubah ke false jika ingin Gist pribadi
            files: {
                'script.txt': {
                    content: content,
                },
            },
        });

        return {
            statusCode: 200,
            body: JSON.stringify({ url: gistResponse.data.html_url }),
        };
    } catch (error) {
        console.error('Error creating Gist:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Failed to create Gist." }),
        };
    }
};