const loginFunc = function(){
    const loginOpenButton = document.getElementById('loginOpenButton');
    const searchBlock = document.getElementById('searchBlock');
    const loginBlock = document.getElementById('loginBlock');
    
    // поведение формы авторизации
    loginOpenButton.addEventListener("click", function(e){
        e.preventDefault();
        loginBlock.classList.toggle("hide");
        searchBlock.classList.add("hide");
    });
}

window.addEventListener('load', loginFunc, false);
