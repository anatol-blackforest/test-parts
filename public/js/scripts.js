(function ($) {
    'use strict';


    var tagRemover = function (string) {
        console.log(typeof string)
        return string.replace(/(<([^>]+)>)/ig,"");
    }

    jQuery(document).ready(function () {

        const socket = io.connect('http://localhost:3000');
        socket.emit('loaded')

        socket.on('message', function(result){

        var html = ""
        console.log("WE HERE")

        result.forEach((item, i) => {
            html += `<div class="col-md-12 blog-post">
                <div class="post-title">
                    <h1>${tagRemover(item.name)}</h1>

                    <form name="editform" class="editform">

                        <div class="col-sm-12">
                            <p>Title:</p>
                            <p>
                            <input type="text" id="title" name="title" class="form-control" placeholder="Title"
                            value="${tagRemover(item.name)}">
                            </p>
                        </div>
                        <div class="text-center">      
                            <button type="submit" data-id="${item.id}" class="edit" 
                            class="bg-color-5 load-more-button">Edit</button>
                            <button data-id="${item.id}" class="delete">Delete</button>
                        </div>

                    </form>
                    <ul class="knowledge">
                        <li class="bg-color-4 editoggle" data-id="${item.id}">Edit or Delete</li>
                    </ul>
                </div>  
            </div>`
        })

        $('#bloglist').html(html)

        })

        
       /* Preloader */
		
        $(window).load(function () {
            $('.preloader').delay(800).fadeOut('slow');
         });
		 		
		
       /* Smooth Scroll */

        $('a.smoth-scroll').on("click", function (e) {
            var anchor = $(this);
            $('html, body').stop().animate({
                scrollTop: $(anchor.attr('href')).offset().top - 50
            }, 1000);
            e.preventDefault();
        });
		
        let activePage = 0
        
        $(window).on('click', function(e){
            if (e.target.nodeName === "A" && e.target.id !== "load-more-post"){
                activePage = 0
            }
            if (e.target.nodeName === "A"){
                $('#addform input[type="text"], #addform textarea').each(function(){
                    $(this).css('border','2px solid transparent');//Сделаем бордер серым
                });    
            }
        })
		
       /* Scroll To Top */
		
        $(window).scroll(function(){
        if ($(this).scrollTop() >= 500) {
            $('.scroll-to-top').fadeIn();
         } else {
            $('.scroll-to-top').fadeOut();
         }
         });
	
	
        $('.scroll-to-top').click(function(){
          $('html, body').animate({scrollTop : 0},800);
          return false;
          });
		  
		  
		  
       /* Tooltip */
	   
        $('[data-toggle="tooltip"]').tooltip();



       /* Popover */
	   
        $('[data-toggle="popover"]').popover();		  
		  
		  
	   
       /* Ajaxchimp for Subscribe Form */
		
        $('#mc-form').ajaxChimp();
        
        $('#addpost').click(function(e) {
            e.preventDefault()
            $('#addformblock').toggle()
            $(this).text($(this).text() == '+ Добавить покупку' ? '- Добавить покупку' : '+ Добавить покупку');
        })
        
        // CRUD

        $( document ).ready(function() {

            //добавление поста
            $("#addform").submit(
                function(e){
                    e.preventDefault()
                    var trigger = true
                    $('#addform input[type="text"], #addform textarea').each(function(){
                        if(!$(this).val() || $(this).val() == ''){
                           $(this).css('border-color','red');//Сделаем бордер красным
                           trigger = false
                        }
                    });
                    
                    if (trigger) { 
                        $.ajax({
                            url:     "/", //url страницы 
                            type:     "POST", //метод отправки
                            dataType: "html", //формат данных
                            data: $("#addform").serialize(),  // Сериализуем объект
                            success: function(response) { //Данные отправлены успешно
                                var result = $.parseJSON(response);
                                $('#hint').html(result.Message)

                                $("#addform").trigger('reset')
                                $("#load-more-post").hide()
                            },
                            error: function() { // Данные не отправлены
                                $('#bloglist').html('Ошибка. Данные не отправлены.');
                            }
                        });

                    }
                }
            );


            $("#bloglist").click(function(e){
                e.preventDefault()

                if(e.target.classList.contains("editoggle")){
                    $(e.target).closest(".post-title").children(".editform").toggle() 
                    $("#postblock").toggle()
                }

                //редактирование поста
                if (e.target.className === "edit"){
                    var form = $(e.target).closest(".editform")
                    console.log("form")
                    console.log(form.serialize())
                    $.ajax({
                        type: "PUT",
                        url: `/${e.target.dataset.id}`, 
                        dataType: "html", //формат данных
                        data: form.serialize(),  // Сериализуем объект
                        success: function(response){

                            var result = $.parseJSON(response);
                            $('#addformblock').hide()
                            $('#hint').html(result.Message)
                            $("#load-more-post").hide()
                        }
                    });
                }
                 
                //удаление поста
                if(e.target.className === "delete"){
                    console.log(e.target.className )
                    var htmlPost = ""
                    var htmlCats = ""
                    var id = e.target.dataset.id
                    $.ajax({
                        type: "DELETE",
                        url: `/${id}`, 
                        success: function(result){
                            console.log(result)
                       
                             $('#hint').html(result.Message)
                            $("#load-more-post").hide()
                        }
                    });
                } 

            });

        
            // аякс подгрузка сообщений при клике на главную

            $("a.posts").click(function(e) {
                e.preventDefault()
                $.ajax({url: "/posts/", success: function(result){

                    var htmlPosts = ""
                    var htmlCats = ""

                    result.posts.forEach((item, i) => {
                        htmlPosts += `<div class="col-md-12 blog-post">
                            <div class="post-title">
                                <h1><a href='/posts/${item._id}'>${tagRemover(item.title)}</a></h1>
                            </div>  
                            <div class="post-info">
                                <span>Date: ${new Date(item.createdAt).toLocaleString()} by Admin</span>
                            </div> 
                            <div class="post-info">
                                <span>Category: ${tagRemover(item.category)}</span>
                            </div>  
                            <p>${tagRemover(item.postbody).slice(0,100)}...</p>      
                            <a href='/posts/${item._id}' class="button button-style button-anim fa fa-long-arrow-right">Read More</a>
                        </div>`
                    })
                    
                    result.categories.forEach((item, i) => {
                        htmlCats += `<span><a href="/category/${tagRemover(item.name)}">${tagRemover(item.name)}</a></span>, `
                    })

                    $('#bloglist').html(htmlPosts)
                    $('#cats').html(htmlCats)
                    $("#load-more-post").show()
                }});

            })

            // аякс подгрузка сообщений из определенной категории при клике на нее в боковухе

            $("#cats").click(function(e) {
                e.preventDefault()
                if (e.target.nodeName === "A"){
                    var val = $(e.target).html();
                    $.ajax({
                        url: `/category/${val}`, 
                        success: function(result){
                            var html = result.name
                            result.postes.forEach((item, i) => {
                                html += `<div class="col-md-12 blog-post">
                                    <div class="post-title">
                                        <h1><a href='/posts/${item._id}'>${tagRemover(item.title)}</a></h1>
                                    </div>  
                                    <div class="post-info">
                                        <span>Date: ${new Date(item.createdAt).toLocaleString()} by Admin</span>
                                    </div> 
                                    <div class="post-info">
                                        <span>Category: ${tagRemover(item.category)}</span>
                                    </div>  
                                    <p>${tagRemover(item.postbody).slice(0,100)}...</p>         
                                    <a href='/posts/${item._id}' class="button button-style button-anim fa fa-long-arrow-right">Read More</a>
                                </div>`
                            })
                            $('#bloglist').html(html)
                            $("#load-more-post").hide()
                        }
                    })
                }

            })

        });

	   
       /* Load More Post */	
       
          $("#load-more-post").on('click', function (e) {
             e.preventDefault();
             $.ajax({url: `/page/${activePage}`, success: function(result){
                var htmlPosts = ""
                result.posts.forEach((item, i) => {
                    htmlPosts += `<div class="col-md-12 blog-post">
                        <div class="post-title">
                            <h1>${tagRemover(item.title)}</h1>
                        </div>  
                        <div class="post-info">
                            <span>Date: ${new Date(item.createdAt).toLocaleString()} by Admin</span>
                        </div> 
                        <div class="post-info">
                            <span>Category: ${tagRemover(item.category)}</span>
                        </div>  
                        <p>${tagRemover(item.postbody).slice(0,100)}...</p>        
                        <a href='/posts/${item._id}' class="button button-style button-anim fa fa-long-arrow-right">Read More</a>
                    </div>`
                })
                activePage += result.activePage
                $('#bloglist').append(htmlPosts)
            }});

           });
			 

		
		
       /* End Box (Popup When Scroll Down) */
	   
        $("#scroll-down-popup").endpage_box({
           animation: "flyInLeft",
           from: "70%",
           to: "100%"
          });
              
		   
            });

   })(jQuery);