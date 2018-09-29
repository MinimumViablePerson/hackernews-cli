#!/usr/bin/env node

const fetch = require('node-fetch')
const cheerio = require('cheerio')
const program = require('commander')

const getPagesArray = number =>
  Array(Math.ceil(number / 30))
    .fill()
    .map((_, index) => index + 1)

const getPageHTML = pageNumber =>
  fetch(`https://news.ycombinator.com/news?p=${pageNumber}`)
    .then(resp => resp.text())

const getAllHTML = async numberOfPosts => {
  if (numberOfPosts < 1 && numberOfPosts > 100) {
    return new Error('Please choose a number between 1 and 100.')
  }

  return Promise.all(getPagesArray(numberOfPosts).map(getPageHTML))
    .then(htmls => htmls.join(''))
}

const getPosts = (html, posts) => {
  let results = []
  let $ = cheerio.load(html)

  $('span.comhead').each(function () {
    let a = $(this).prev()

    let title = a.text()
    let uri = a.attr('href')
    let rank = a.parent().parent().text()

    let subtext = a.parent().parent().next().children('.subtext').children()
    let author = $(subtext).eq(1).text()
    let points = $(subtext).eq(0).text()
    let comments = $(subtext).eq(5).text()

    let obj = {
      title: title,
      uri: uri,
      author: author,
      points: parseInt(points),
      comments: parseInt(comments),
      rank: parseInt(rank)
    }
    if (obj.rank <= posts) {
      results.push(obj)
    }
  })
  if (results.length > 0) {
    console.log(results)
    return results
  }
}

program
  .option('-n, --number [value]', 'Number of posts', 30)
  .action(args =>
    getAllHTML(args.number)
      .then(html => getPosts(html, args.number))
  )

program.parse(process.argv)
