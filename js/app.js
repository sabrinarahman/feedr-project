import _ from 'lodash';
import $ from 'jquery';
window.jQuery = $;
window.$ = $;

$(document).ready(function(){
  // Array to store all feed sources
  var SOURCES = [
    {
      displayName: "Reddit",
      url: "https://www.reddit.com/r/worldnews/top/.json",
      proxyRequired: false,
      defaultSource: true, // You can have only one default source
      formatResponse: function(response) {
        return _.map(response.data.children, function(child) {
          return {
            title: child.data.title,
            author: child.data.author,
            score: child.data.score,
            link: child.data.url,
            thumbnail: child.data.thumbnail,
            tag: child.data.subreddit,
            description: child.data.domain
          };
        });
      }
    },
    {
      displayName: "Digg",
      url: "http://digg.com/api/news/popular.json",
      proxyRequired: true,
      defaultSource: false,
      formatResponse: function(response) {
        const articles = response.data.feed;
        return _.map(articles, function(article) {
          return {
            description: article.content.description,
            score: article.digg_score,
            link: article.content.url,
            tag: article.content.kicker,
            title: article.content.title,
            thumbnail: article.content.media.images[0].url
          };
        });
      }
    },
    {
      displayName: "Mashable",
      url: "http://mashable.com/stories.json",
      proxyRequired: true,
      defaultSource: false,
      formatResponse: function(response) {
        const articles = response.new;
        return _.map(articles, function(article) {
          return {
            description: article.content.plain,
            score: article.shares.total,
            link: article.link,
            tag: article.channel,
            title: article.title,
            thumbnail: article.responsive_images[2].image
          };
        });
      }
    }
  ];
  // Prefix url for proxy
  var PROXY_URL = "https://accesscontrolalloworiginall.herokuapp.com/";
  // Utils object to store any misc. methods
  var Utils = {
    getArticlesMarkup: function(articles) {
      return _.map(articles, function(article) {
        return Utils.getSingleArticleMarkup(article);
      });
    },
    getSingleArticleMarkup: function(article) {
      return `<article class="article clearfix">
          <section class="featuredImage">
              <img src="${article.thumbnail}" alt="">
          </section>
          <section class="articleContent">
              <a href="${article.link}"><h3>${article.title}</h3></a>
              <h6>${article.tag}</h6>
          </section>
          <section class="impressions">${article.score}</section>
      </article>`
    }
  };

  var App = {
    init: function() {
      // Methods that need to be called on initialization
      App.bindEvents();
      App.showDefaultFeed();
    },
    bindEvents: function() {
      // Attach event listeners
      $('#main').on('click', '.article', function(e) {
        console.log("clicked article");
        e.preventDefault();
        App.setView("detail");
        var index = $(this).index();
        App.changePopupData(App.articles[index]);
      })

      $('.closePopUp').on('click', function() {
        App.setView("feed");
      })

      $('#search').on('click', function() {
        $('#search').addClass('active');
      })

      $('.sources-dropdown li').on('click', function() {
        var index = $(this).index();
        App.showFeed(SOURCES[index]);
      })
    },
    showDefaultFeed: function() {
      const defaultFeed = _.find(SOURCES, { defaultSource: true });
      App.showFeed(defaultFeed);
    },
    showFeed: function(feed) {
      const request = App.requestFeed(feed.url, feed.proxyRequired);
      request.done(function(response) {
        const articles = feed.formatResponse(response);
        App.articles = articles;
        App.renderFeed(articles);
        App.setView("feed");
      });
    },
    requestFeed: function(url, proxyRequired) {
      const feedUrl = proxyRequired ? PROXY_URL + url : url;
      App.setView("loader");
      return $.ajax(feedUrl, {
        dataType: "json"
      });
    },
    renderFeed: function(articles) {
      const articlesMarkup = Utils.getArticlesMarkup(articles);
      $("#main").html(articlesMarkup);
    },
    setView: function(viewType) {
      var $popup = $('#popUp');
      var $closePopUp = $('.closePopUp');
      if (viewType === 'loader') {
        $popup.removeClass('hidden');
        $closePopUp.addClass('hidden');
        $popup.addClass('loader');
      }
      else if (viewType === 'detail') {
        $popup.removeClass('hidden');
        $closePopUp.removeClass('hidden');
        $popup.removeClass('loader');
      }
      else if (viewType === 'feed') {
        $popup.addClass('hidden');
        $closePopUp.addClass('hidden');
      }
    },
    changePopupData: function(article) {
      console.log(article);
      $('#popUp h1').html(article.title);
      $('#popUp p').html(article.description);
      $('.popUpAction').attr('href', article.link);
    }
  };
  App.init();
});
