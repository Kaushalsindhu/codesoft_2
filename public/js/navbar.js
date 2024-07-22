let options = document.querySelectorAll('#navbar a');
let home = document.querySelector('#navbar a');

let collapse = document.querySelector('#collapse');

collapse.addEventListener('click',()=>{
    let navbar = document.querySelector('#navbar');
    navbar.classList.toggle('activeNav');
})

options.forEach(option =>{
    if(window.location.href === option.href){
        option.classList.add('active');
    }
})

options.forEach(option =>{
    option.addEventListener('click',()=>{
        navbar.classList.remove('activeNav');
        document.querySelector('.active').classList.remove('active');
        option.classList.add('active');
    })
})

