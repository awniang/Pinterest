SELECT * FROM images;

SELECT * FROM images ORDER BY annee  desc;

SELECT * FROM images ORDER BY annee desc LIMIT 3;

SELECT * FROM images WHERE annee > '2022-01-01';

SELECT * FROM images WHERE likes > 10;

SELECT * FROM images JOIN orientations ON images.orientation = orientations.id;

SELECT * FROM images JOIN auteurs ON images.id_auteur = auteurs.id WHERE auteurs.nom = 'Duchamp';

SELECT * FROM images JOIN auteurs ON  images.id_auteur = auteurs.id WHERE auteurs.nom = 'Duchamp' AND images.orientation = (SELECT id FROM orientations WHERE orientation = 'portrait');

SELECT SUM(likes) FROM images JOIN auteurs ON  images.id_auteur = auteurs.id WHERE auteurs.nom = 'Duchamp';

