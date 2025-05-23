const http = require ("http");
const crypto = require("crypto");
const server =  http.createServer();
const host = 'localhost';
const port = 8090;
const fs = require("fs");

const { Client } = require('pg');
const client = new Client({
    database: 'application_image',
});
client.connect()
.then(() => {
    console.log('Connected to database');
})
.catch((e) => {
    console.log('Error connecting to database');
    console.log(e);
}); 
let lastSessionId = 0;
let sessions = [];



server.on("request",async (req, res) => {
    let hasCookieWithSessionId = false;
    let sessionId = undefined;
    if (req.headers['cookie'] !== undefined) {
        let sessionIdInCookie = req.headers['cookie'].split(';').find(item => item.startsWith('session-id'));
        if (sessionIdInCookie !== undefined) {
            let sessionIdInt = parseInt(sessionIdInCookie.split('=')[1]);
            if (sessions[sessionIdInt]) {
                hasCookieWithSessionId = true;
                sessionId = sessionIdInt;
                //sessions[sessionId].nbRequest++;
                //connected = [sessionId].username!==undefined;
            }
        }
    }
    if (!hasCookieWithSessionId) {
        lastSessionId++;
        res.setHeader('Set-Cookie', `session-id=${lastSessionId}`);
        sessionId = lastSessionId;
        sessions[lastSessionId] = {};
    }
    if (req.url === "/index" || req.url === "/"){
        let html = '<!DOCTYPE html><html>';
        try {
            const sqlQuery = 'SELECT * FROM images ORDER BY annee desc LIMIT 3;';
            const res = await client.query(sqlQuery);
            const fichiersImage = res.rows.map(row => row.fichier);
            html += '<head><title>Mon mur d\'images</title><link rel = "stylesheet" href="/public/style.css"></head>'
            html += '<body>'
            if (!sessions[sessionId].username){
                html += '<div><a href="/signup">S\'inscrire</a>'
                html += '<a href="signin">Se connecter</a>'
            } else {
                html += '<span>Bonjour '+sessions[sessionId].username+' </span>'
                html += '<a href="/logout">Se deconnecter</a></div>';
            }
            html += '<div class ="center">'
            html += '<img src = "/public/images/logo.png" alt = "logo"><p>Vous trouverez ici toutes les images que j\'aime.</p><div>'
            for (let i = 0; i < 3; i++){
                const fichierSmallImage = fichiersImage[i].split('.')[0] + '_small.jpg';
                const img = '<img src ="/public/images/'+fichierSmallImage+'"/>';
                html += '<a href = "/page_image/'+(res.rows[i].id)+'">' + img + '</a>';
            }
            html += '</div>';
            html+= '<a href = "/images">Toutes les Images</a>'
            html += '</div>'
            html += "</body></html>";    
        } catch (e) {
            console.log(e);
        }
        res.end(html);
    }else if (req.url.startsWith('/public/')){
        try {
            const fichier = fs.readFileSync('.'+req.url);
            res.end(fichier);
        }catch(err){
            console.log(err);
            res.end('erreur ressource inconnue');
        }
    } else if (req.url === "/images") {
        let html = '<!DOCTYPE html><html lang = "fr">';
        try {
            const sqlQuery = 'SELECT * from images'; 
            const res = await client.query(sqlQuery); 
            const fichiersImage = res.rows.map(row => row.fichier);
            html += '<head><title>Mon Mur d\'images</title><link rel = "stylesheet" href="/public/style.css"></head>';
            html+= '<body>';
            if (!sessions[sessionId] || !sessions[sessionId].username){
                html += '<div><a href="/signup">S\'inscrire</a>'
                html += '<a href="signin">Se connecter</a>'
            } else {
                html += '<span>Bonjour '+sessions[sessionId].username+' </span>'
                html += '<a href="/logout">Se deconnecter</a></div>';
            }
            html += `<div><a href ="/">Index</a></div>
                    <div class= "center">
                        <h1>Mur d\'images</h1>
                    </div>`;
                    
            const username = sessions[sessionId].username; //stocke l'id de l'utilisateur qui est connecté
            html += '<div id="mur">';
            //console.log('username='+username);
            for (let i = 0 ; i < fichiersImage.length ; i++) {
                const fichierSmallImage = fichiersImage[i].split('.')[0] + '_small.jpg';
                const img = '<img src="/public/images/'+fichierSmallImage+'" />';
                let isLiked = false;
                if (username){
                    const userIdquery = `SELECT id FROM account WHERE username ='${username}';`;
                    const userIdRes = await client.query(userIdquery);
                    const userId = userIdRes.rows.map(row => row.id)[0];
                    const imageID = res.rows[i].id;
                    const islikequery = 'SELECT COUNT(*) FROM accounts_images_like WHERE image_id='+imageID+' AND account_id='+userId+';';
                    const islikeRes = await client.query(islikequery);
                    isLiked = parseInt(islikeRes.rows[0].count) > 0;

                }
                html += '<a href="/page_image/'+(res.rows[i].id)+'" >' + img + '</a>';
                if (username && isLiked){
                        html += '<p>Liked</p>';
                    } else if (username) {
                        html += '<a href="/like/'+(res.rows[i].id)+'">Like</a>'

                    }
                }
            
            

                //console.log(userIdRes.rows);
                /*const imageIDsql = 'SELECT image_id FROM accounts_images_like WHERE account_id = '+userId+';'
                const rest = await client.query(imageIDsql);*/
                
                //const islikedquery = 'SELECT image_id FROM accounts_images_like WHERE  image_id='+imageID+' AND account_id = '+userId+';'; 
                //console.log(islikedquery);
                //console.log(username);
                //const isLiked = await client.query(islikedquery).rows.count > 0;
                //console.log(isLiked);
                //console.log(imageID);
                //if (sessions[sessionId].username && sessions[sessionId]){
                    //if (isLiked/*.rows.length*/){
                        //html += '<a href="/like/'+(res.rows[i].id)+'">Like</a>' //à enlever
                        //html += '<p>Liked</p>';
                    /*}else {
                        html += '<a href="/page_image/'+(res.rows[i].id)+'" >' + img + '</a>';
                    }
                } else {
                    html += '<a href="/page_image/'+(res.rows[i].id)+'" >' + img + '</a>';
                }*/
            
            html += '</div>';
            html += '</body></html>';
        } catch (e) {
            console.log(e);
        }
        res.end(html);
    }else if (req.method === "POST" && req.url === "/image-description") {
        let data
        req.on('data', (Chunk) => {
            data += Chunk.toString();
        });
        req.on("end",async () => {
            const id_image = data.split('&')[0].split('=')[1];
            const texte = data.split('&')[1].split('=')[1];
            try{
                
                const sqlQuery = `INSERT INTO commentaires (texte, id_image) VALUES ('${texte}', ${id_image});`; 
                const res = await client.query(sqlQuery);   
            } catch (e) {
                console.log(e);  
            }
            res.statusCode = 302;
            res.setHeader('Location', '/page_image/'+id_image+'');
            res.end();
        });
    } else if (req.url.startsWith("/page_image")) {
        let images = fs.readdirSync("./public/images");
        let images_small =images.filter(f => f.endsWith("_small.jpg"));
        let imageID = +req.url.split("/")[2];
        let html = '<!DOCTYPE html><html lang = "fr">';
        try {
            const sqlQuery = `SELECT texte  from commentaires WHERE id_image = `+ imageID +`;`; 
            const sqlQuery1 = `SELECT * from images WHERE id = `+ imageID +`;`;
            const res = await client.query(sqlQuery); 
            const resp = await client.query(sqlQuery1); 
            const comment = res.rows.map(row => row.texte);
            const nom = resp.rows.map(row => row.nom);
            html += '<head><title>Images</title><link rel = "stylesheet" href="/public/style.css"><a href ="/images">Mur</a>'
            html += '<script src="/public/page-image.js" defer></script>'
            html += '</head>';
            html += `<body>`;
            html += `<div class ="center"><a href = "/page_image/`+(imageID)+`"><img src = "/public/images/image`+(imageID)+`.jpg" width = "500"></a>`;
            html += `<form action ="/image-description" method = "POST">`;
            for (k = 0; k < nom.length;k++){
                html += `<p>${nom[k]}</p>`;
            }
            html += `<h4>Ajouter un nouveau commentaire</h4>`;
            for (let p = 0; p < comment.length;p++){
                    html += `<p>${(comment[p])}</p>`
                }
            html += `<input type="hidden" id="id_image" name="id_image" value = "${imageID}">`;
            html += `<label for ="comment">Commentaire: </label>`;
            html += `<input type="text" id ="comment" name="comment">`;
            html += `<input type ="submit" id ="bouton" value="envoyer"></form></div>` 
        } catch (e) {
            console.log(e);  
        }if (imageID-1 <=0){
            html += `<div id= "image2">`
            html += `<span><a href = "/page_image/`+(imageID+1)+`"><img src = "/public/images/image`+(imageID+1)+`_small.jpg"></a></span></div>`;
        } else if (imageID+1>images_small.length){
            html += `<div class = "left">`;
            html += `<span ><a href = "/page_image/`+(imageID-1)+`"><img src = "/public/images/image`+(imageID-1)+`_small.jpg"></a></span></div>`;
            } else  { 
            html += `<div>`;
            html += `<span class = "left"><a href = "/page_image/`+(imageID-1)+`"><img src = "/public/images/image`+(imageID-1)+`_small.jpg"></a></span>`;
            html += `<span class = "right"><a href = "/page_image/`+(imageID+1)+`"><img src = "/public/images/image`+(imageID+1)+`_small.jpg"></a></span>`;
            html += `</div>`;
        }
        html+='</body><html>';
         res.end(html);
    }else if (req.url.startsWith('/like/') && req.method === 'GET'){
        const imageID = req.url.split('/')[2];
        if (sessions[sessionId].username && sessions[sessionId]){
            const username = sessions[sessionId].username; //stocke l'id de l'utilisateur qui est connecté
            try {
                const userIdquery = `SELECT id FROM account WHERE username ='${username}';`;
                const userIdRes = await client.query(userIdquery);
                const userId = userIdRes.rows.map(row => row.id)[0];
                //const userId = userIdResult.rows[0].id;
                const likequery = `INSERT INTO accounts_images_like(image_id, account_id) VALUES ('${imageID}','${userId}');`
                const result = await client.query(likequery);
                res.writeHead(302,{'Location': '/images'});
                res.end();
            } catch(e){
                console.log(e);
            }
        }else{
            res.writeHead(302,{'Location': '/signin'});
            res.end();
        }
    
    
    }else if (req.url === '/signup' && req.method === 'GET') {
        res.end(generateSignFormPage(true));
    } else if (req.url === '/signup' && req.method === 'POST') {
        let data;;
        req.on("data", (dataChunk) => {
            data += dataChunk.toString();
        });
        req.on("end", async () => {
            try {
                const params = data.split("&");
                const username = params[0].split("=")[1];
                const password = params[1].split("=")[1];
                const findQuery = `select username from account where username='${username}'`; 
                const findResult = await client.query(findQuery);
                const USERNAME_IS_UNKNOWN = 0;
                if (parseInt(findResult.rowCount) === USERNAME_IS_UNKNOWN) {
                    const salt = crypto.randomBytes(16).toString('hex');
                    const hash = crypto.createHash("sha256").update(password).update(salt).digest("hex");
                    const insertQuery = `INSERT INTO account (username, salt, hash) VALUES ('${username}', decode('${salt}','hex') , decode('${hash}','hex'));`; 
                    await client.query(insertQuery); 
                    res.end(`<html><body><h1>Sign Up is a Success</h1><a href="/signin">You can sign in now !</a></body></html>`);
                } else {
                    res.end(`<html><body><h1>Sign UP Failure</h1><div>Username already signed up !</div><a href="/">Retry</a></body></html>`);
                }
            } catch(e) {
                console.log(e);
                res.end(`<html><body><h1>Failure</h1><a href="/">Retry</a></body></html>`);
            }
            res.end();
        });
    } else if (req.url === '/signin' && req.method === 'GET') {
        res.end(generateSignFormPage(false));
    } else if (req.url === '/signin' && req.method === 'POST') {
        let data;
        req.on("data", (dataChunk) => {
            data += dataChunk.toString();
        });
        req.on("end", async () => {
            try {
                const params = data.split("&");
                const username = params[0].split("=")[1];
                const password = params[1].split("=")[1];
                const findQuery = `select username, encode(salt,'hex') as salt, encode(hash,'hex') as hash from account where username='${username}'`; 
                const findResult = await client.query(findQuery);
                const USERNAME_IS_UNKNOWN = 0;
                if (parseInt(findResult.rows.length) !== USERNAME_IS_UNKNOWN) {
                    const salt = findResult.rows[0].salt;
                    const trueHash = findResult.rows[0].hash;
                    const computedHash = crypto.createHash("sha256").update(password).update(salt).digest("hex");
                    if (trueHash === computedHash) { //AUTHENTICATED
                        sessions[sessionId].username = username;
                        res.writeHead(302,{'Location': '/index'});
                        res.end();
                    } else {
                        res.end(`<html><body><h1>Sign IN Failure</h1> Wrong Password ! <a href="/signin">Retry</a></body></html>`);
                    }
                } else {
                   res.end(`<html><body><h1>Sign IN Failure</h1> Wrong Username ! <a href="/signin">Retry</a></body></html>`);
                }
            } catch(e) {
                console.log(e);
                res.end(`<html><body><h1>Something goes wrong</h1> <a href="/">Retry</a></body></html>`);
            }
        });
    }else if (req.url === "/logout" && req.method === "GET") {
        // Supprimer la session de l'utilisateur en mettant à jour le tableau sessions
        sessions[sessionId] = {};
        // Rediriger l'utilisateur vers la page d'accueil ou une autre page après la déconnexion
        res.writeHead(302, { 'Location': '/' });
        res.end();
    } else {
        res.end("erreur URL invalide");
        }
});

function generateSignFormPage(up) {
    let signWhat = up ? 'signup' : 'signin';
    return `<html><body><h1>${signWhat}</h1>
            <form action='/${signWhat}' method="POST">
            <label for="username">Username: </label>
            <input type="text" name="username" id="username" required>
            <label for="username">Password: </label>
            <input type="password" name="password" id="password" required>
            <input type="submit" value="${signWhat}!">
            </form>
            </body></html>`;
    }
    
server.listen(port, host, () => {
    console.log(`Server running at http://${host}:${port}/`);
});
    
    