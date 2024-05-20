const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const port = 3001;

async function searchGoogle(query) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.goto(`https://www.google.com/search?q=${encodeURIComponent(query)}`);

    // Wait for the results to load and display the results.
    await page.waitForSelector('h3');

    // Extract the content of the first search result.
    const result = await page.evaluate(() => {
        const firstResult = document.querySelector('h3');
        if (firstResult) {
            return {
                title: firstResult.innerText,
                link: firstResult.closest('a').href,
            };
        }
        return null;
    });

    if (result) {
        console.log(`Title: ${result.title}`);
        console.log(`Link: ${result.link}`);

        // Visit the link and extract the main content
        await page.goto(result.link);
        const content = await page.evaluate(() => {
            const paragraphs = Array.from(document.querySelectorAll('p'));
            return paragraphs.map(p => p.innerText).join('\n');
        });

        console.log(`Content:\n${content}`);
        await browser.close();
        return { title: result.title, link: result.link, content: content };
    } else {
        await browser.close();
        return { error: 'No results found.' };
    }
}

app.get('/search', async (req, res) => {
    const query = req.query.q;
    if (!query) {
        return res.status(400).send({ error: 'Query parameter is required' });
    }

    try {
        const result = await searchGoogle(query);
        res.send(result);
    } catch (error) {
        console.error('Error searching Google:', error);
        res.status(500).send({ error: 'An error occurred while searching' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
