const getButton = document.getElementById('get');

getButton.addEventListener('click', (e) => {
    fetch('api/stat?duration=1&ticker=MOEX&sum=1000')
        .then((response) => response.json())
        .then((response) => {
            const {bought, history} = response;
            console.log(response);
            const html = `
            За 1 год вы вложили ${bought.contributionAmount} и купили ${bought.finalAmount} акций.
            Сейчас они стоят ${bought.finalAmount * history[history]}
            `;
            document.body.appendChild(document.createTextNode(html));
        });
    e.preventDefault();
});