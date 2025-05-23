let mainImage=document.querySelectorAll('img')[0];
mainImage.addEventListener('click',(e)=>{
    e.preventDefault();
    e.target.width+=10;
});
mainImage.addEventListener('contextmenu',(e)=>{
    e.preventDefault();
    e.target.width-=10;
});
let submitButton=document.querySelector("#bouton");
let commentaire = document.getElementById('comment');
submitButton.disabled=true;
commentaire.addEventListener('keyup', (e) => {
  
  submitButton.disabled=commentaire.value ===''|| commentaire.value.includes( 'DROP');
});