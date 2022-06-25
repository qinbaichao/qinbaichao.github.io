/**
 * 标签页面标签显示逻辑
 */
function showTag() {
  if(layui.url().pathname.toString().indexOf("tag.html") == -1) {
    return;
  }
  let tag = decodeURI(layui.url().search.tag);
  let elements = layui.$("[tag~='"+ tag +"']");
  if(elements.size() == 0) {
    tag = layui.$(".pagetitle").first().attr("tag");
  }
  console.log("tag", tag);
  layui.$("[tag~='"+ tag +"']").show();
}
/**
 * 分类页面显示逻辑
 */
function showCategory() {
  if(layui.url().pathname.toString().indexOf("category.html") == -1) {
    return;
  }
  let category = decodeURI(layui.url().search.category);
  console.log("category", category);
  let elements = layui.$("[category~='"+ category +"']");
  if(elements.size() == 0) {
    category = "未分类";
  }
  elements.show();
  for(var i=0;i < elements.size(); i++) {
      //只处理article元素
      if(elements.get(i).tagName != "ARTICLE") {
        continue;
      }
      let articleElement = layui.$(elements.get(i));
      let element = articleElement.find("a[id='category']");
      let href = element.attr("href");
      //替换文案
      element.text(category);
      let newHref = href.split("=")[0] + "=" + category;
      element.attr("href", newHref);

      let postElement = articleElement.find("a[id='_post_list_category']");
      let postHref = postElement.attr("href");
      let postNewHref = postHref.split("=")[0] + "=" + category;
      postElement.attr("href", postNewHref);
  }

}
/**
 * 文章页面分类控制
 */
function postCategory() {
  //url中没有分类不做任何处理
  let category = layui.url().search.category;
  if(!category){
    return;
  }
  category = decodeURI(layui.url().search.category);
  console.log("category", category);
  //判断当前页是否是文章页面
  let element = layui.$("#_post_category");
  if(element.size() == 0) {
    return;
  }
  //分类校验
  if(element.attr("category").indexOf(category) == -1) {
    return;
  }
  let href = element.attr("href");
  //当前显示的分类就是url中的分类
  if(href.indexOf(category) != -1) {
    return;
  }
  //替换文案
  element.text(category);
  let newHref = href.split("=")[0] + "=" + category;
  element.attr("href", newHref);
}

layui.use(["element", "form", "jquery"], function() {
  var $ = layui.jquery;
  var sideBarWidth = 950;
  //屏幕小于指定宽度使用左侧导航栏
  if (document.body.clientWidth < sideBarWidth) {
    $(".layui-nav").addClass("layui-nav-tree layui-nav-side");
  }
  $(".nav-button").on("click", function() {
    //显示mask层和左侧导航栏
    $("body").addClass("m-nav-show");
    $(this).removeClass("layui-icon-spread-left");
    $(this).addClass("layui-icon-shrink-right");
  });
  $("#closeButton").on("click", function(e) {
    //隐藏mask层和左侧栏导航栏
    $("body").removeClass("m-nav-show");
    var navButton = $(".nav-button");
    navButton.removeClass("layui-icon-shrink-right");
    navButton.addClass("layui-icon-spread-left");
  });
  //监听窗口变化
  window.addEventListener("resize", function() {
    //屏幕小于指定宽度使用左侧导航栏
    if (document.body.clientWidth < sideBarWidth) {
      $(".layui-nav").addClass("layui-nav-tree layui-nav-side");
    } else {
      $(".layui-nav").removeClass("layui-nav-tree layui-nav-side");
    }
  });
  showTag();
  showCategory();
  postCategory();
});



layui.use("carousel", function() {
  var carousel = layui.carousel;
  var showArrowWidth = 1024;
  var arrow = "hover";
  if (document.body.clientWidth <= showArrowWidth) {
    //始终显示箭头
    arrow = "always";
  }
  //建造实例
  carousel.render({
    elem: "#test1",
    width: "100%",
    height: "100%",
    arrow: arrow
    //,anim: 'updown' //切换动画方式
  });
  //监听窗口变化
  window.addEventListener("resize", function() {
    arrow = "hover";
    if (document.body.clientWidth <= showArrowWidth) {
      //始终显示箭头
      arrow = "always";
    }
    //重置配置
    carousel.render({
      width: "100%",
      height: "100%",
      arrow: arrow
    });
  });
  window.carousel = carousel;
});
