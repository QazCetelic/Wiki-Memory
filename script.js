const cardsElem = document.getElementById("cards");
const menuElem = document.getElementById("menu");

let cardsLeft = 0;
let firstCard = null;
let secondCard = null;
let matches = 0;
let fails = 0;

const params = new Proxy(new URLSearchParams(window.location.search), {
    get: (searchParams, prop) => searchParams.get(prop),
});

// 4..30
const cardCount = Math.min(Math.max(params.cardCount ? parseInt(params.cardCount) : 10, 4), 30);

let wikiUrl = params.wikiUrl ? params.wikiUrl : "wikipedia.org";
if (!wikiUrl.startsWith("http://")) wikiUrl = "http://" + wikiUrl;
if (wikiUrl.endsWith("/")) wikiUrl = wikiUrl.slice(0, -1);

function flipCard(card) {
    // Prevent flipping the card if it's already flipped
    if (card.classList.contains("card-selected")) return;

    card.classList.toggle("card-selected", true);
    if (firstCard === null) {
        firstCard = card;
    }
    else if (secondCard === null) {
        secondCard = card;

        if (firstCard.value === secondCard.value) {
            firstCard = null;
            secondCard = null;
            matches++;
            cardsLeft -= 2;
        }
        else {
            fails++;
            cardsElem.classList.add("cards-fail");
            setTimeout(() => {
                firstCard.classList.toggle("card-selected", false);
                secondCard.classList.toggle("card-selected", false);
                firstCard = null;
                secondCard = null;
                cardsElem.classList.remove("cards-fail");
            }, 1500);
        }
    }

    if (cardsLeft === 0) {
        menuElem.classList.toggle("hidden", false);
        cardsElem.classList.toggle("hidden", true);
    }
}

function addCard(title, description) {
    let card = document.createElement("div");
    card.value = title;
    card.classList.add("card");

    let cardInner = document.createElement("div");
    cardInner.classList.add("card-inner");

    let cardFront = document.createElement("div");
    cardFront.classList.add("card-front");

    let cardBack = document.createElement("div");
    cardBack.classList.add("card-back");
    let cardTitle = document.createElement("h1");
    cardTitle.classList.add("card-title");
    cardTitle.innerText = card.value;
    cardBack.appendChild(cardTitle);
    let cardDescription = document.createElement("p");
    cardDescription.classList.add("card-description");
    cardDescription.innerText = description;
    cardBack.appendChild(cardDescription);
    let cardLink = document.createElement("a");
    cardLink.classList.add("card-link");
    cardLink.href = `${wikiUrl}/wiki/${encodeURIComponent(card.value)}`;
    cardLink.innerText = `Article on ${wikiUrl.replace("http://", "").split(".")[0]}`;
    cardLink.target = "_blank";
    cardBack.appendChild(cardLink);

    cardInner.appendChild(cardFront);
    cardInner.appendChild(cardBack);
    card.appendChild(cardInner);
    cardsElem.appendChild(card);

    cardsLeft++;
    card.onclick = () => flipCard(card);
}

function handleResponse(data) {
    const pages = data.query.pages;
    let cardDataArray = [];
    for (let pageKey in pages) {
        let page = pages[pageKey];
        let cardData = {
            title: page.title,
            description: page.description,
            link: `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title)}`
        }
        if (cardData.description === undefined) {
            cardData.description = page.extract;
        }
        cardDataArray.push(cardData);
    }

    cardDataArray.push(...cardDataArray);
    cardDataArray.sort(() => Math.random() - 0.5);
    cardDataArray.forEach(value => addCard(value.title, value.description ?? "", value.link));
}

// CORS workaround
const script = document.createElement('script');
script.src = wikiUrl + `/w/api.php?action=query&generator=random&grnnamespace=0&grnlimit=${cardCount / 2}&prop=info|description|extracts&format=json&callback=handleResponse`;
document.body.appendChild(script);