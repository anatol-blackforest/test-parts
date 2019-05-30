const searchFunc = function(){
    const searchOpenButton = document.getElementById('searchOpenButton');
    const searchBlock = document.getElementById('searchBlock');
    const loginBlock = document.getElementById('loginBlock');
    
    // поведение формы поиска
    searchOpenButton.addEventListener("click", function(e){
        e.preventDefault();
        searchBlock.classList.toggle("hide");
        loginBlock.classList.add("hide");
    });
}

window.addEventListener('load', searchFunc, false);
