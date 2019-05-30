const menuFunc = function(){
    const index = document.getElementById('index');
    
    // поведение формы авторизации
    index.addEventListener("click", function(e){
        e.preventDefault();
        // loginBlock.classList.toggle("hide");
        // searchBlock.classList.add("hide");
    });
}

window.addEventListener('load', menuFunc, false);
