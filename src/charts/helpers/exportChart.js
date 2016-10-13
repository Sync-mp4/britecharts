define(function(require) {
    'use strict';

    const bowser = require('bowser');
    const {britechartsGreySchema : colors} = require('./colors.js');
    const constants = require('./constants.js');
    const serializeWithStyles = require('./serializeWithStyles.js');

    let encoder = window.btoa;

    if (!encoder) {
        encoder = require('base-64').encode;
    }

    const config = {
        styleClass : 'britechartStyle',
        defaultFilename: 'britechart.png',
        chartBackground: 'white',
        imageSourceBase: 'data:image/svg+xml;base64,',
        get styleBackgroundString () {
            return `<style>svg{background:${this.chartBackground};}</style>`;
        }
    };

    /**
     * Main function to be used as a method by chart instances to export charts to png
     * @param  {array} svgs (or an svg element) pass in both chart & legend as array or just chart as svg or in array
     * @param  {string} filename [download to be called <filename>.png]
     */
    function exportChart(d3svg, filename, title) {
        let img = createImage(convertSvgToHtml(d3svg, title));

        img.onload = handleImageLoad.bind(
                img,
                createCanvas(this.width(), this.height()),
                filename
            );
    }

    /**
     * adds background styles to raw html
     * @param {string} html raw html
     */
    function addBackground(html) {
        return html.replace('>',`>${config.styleBackgroundString}`);
    }

    /**
     * takes d3 svg el, adds proper svg tags, adds inline styles
     * from stylesheets, adds white background and returns string
     * @param  {object} d3svg TYPE d3 svg element
     * @return {string} string of passed d3
     */
    function convertSvgToHtml (d3svg, title) {
        if (!d3svg) {
            return;
        }
        d3svg.attr({ version: 1.1, xmlns: 'http://www.w3.org/2000/svg'});

        let serializer = serializeWithStyles.initializeSerializer();
        let html = serializer(d3svg.node());
        html = formatHtmlByBrowser(html);
        html = prependTitle(html, title, parseInt(d3svg.attr('width')));
        html = addBackground(html);
        return html;
    }

    /**
     * Create Canvas
     * @param  {number} width
     * @param  {number} height
     * @return {object} TYPE canvas element
     */
    function createCanvas(width, height) {
        let canvas = document.createElement('canvas');

        canvas.height = height;
        canvas.width = width;
        return canvas;
    }

    /**
     * Create Image
     * @param  {string} svgHtml string representation of svg el
     * @return {object}  TYPE element <img>, src points at svg
     */
    function createImage(svgHtml) {
        let img = new Image();

        img.src = `${config.imageSourceBase}${encoder(svgHtml)}`;
        return img;
    };

    /**
     * Draws image on canvas
     * @param  {object} image TYPE:el <img>, to be drawn
     * @param  {object} canvas TYPE: el <canvas>, to draw on
     */
    function drawImageOnCanvas(image, canvas) {
        canvas.getContext('2d').drawImage(image, 0, 0);
    }

    /**
     * Triggers browser to download image, convert canvas to url,
     * we need to append the link el to the dom before clicking it for Firefox to register
     * point <a> at it and trigger click
     * @param  {object} canvas TYPE: el <canvas>
     * @param  {string} filename
     * @param  {string} extensionType
     */
    function downloadCanvas(canvas, filename='britechart.png', extensionType='image/png') {
        let url = canvas.toDataURL(extensionType);
        let link = document.createElement('a');

        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    /**
     * Some browsers need special formatting, we handle that here
     * @param  {string} html string of svg html
     * @return {string} string of svg html
     */
    function formatHtmlByBrowser(html) {
        if (bowser.name === 'Firefox') {
            return html.replace(/url.*&quot;\)/, `url(&quot;#${constants.lineGradientId}&quot;);`);
        }

        return html;
    }

    /**
     * Mounts a text node to grab the assumed width
     * @param  {string} title title to be mounted
     * @return {string}      width of title assuming its mounted
     */
    function getTitleWidth(title) {
        let div = document.createElement('div');
        div.innerHTML = `<text id="britechart_title" y="40" font-family="'Heebo', sans-serif" style="display=none" font-size="20px">${title}</text>`;
        let text = div.childNodes[0];
        document.body.appendChild(text);
        let titleWidth = document.getElementById('britechart_title').offsetWidth;
        text.remove();
        return titleWidth;
    }

    /**
     * Handles on load event fired by img.onload, this=img
     * @param  {object} canvas TYPE: el <canvas>
     * @param  {string} filename
     * @param  {object} e
     */
    function handleImageLoad(canvas, filename, e) {
        e.preventDefault();
        drawImageOnCanvas(this, canvas);
        downloadCanvas(canvas, filename || config.defaultFilename);
    }

    /**
     * if passed, append title to the raw html to appear on graph
     * @param  {string} html     raw html string
     * @param  {string} title    title of the graph
     * @param  {number} svgWidth width of graph container
     * @return {string}         raw html with title prepended
     */
    function prependTitle(html, title, svgWidth) {
        if (!title || !svgWidth) {
            return html;
        }
        let titleWidth = getTitleWidth(title);

        return html.replace(/<g/,
            `svg">
                <text x="${(svgWidth/ 2) - (titleWidth / 2)}" y="40" font-family="'Heebo', sans-serif" font-size="20px" fill="${colors[6]}">
                    ${title}
                </text><g
            `);
    }

    return exportChart;
});
