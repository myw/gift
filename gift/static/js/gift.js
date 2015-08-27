Gift = function (_, Chance, d3) {

  /*
   * CONVENTIONS:
   *  - When I need to reference the original `this`, that variable is `self`
   *  - If `self` is ever assigned to in a function, it is used throughout that
   *    function instead of `this`.
   */

  function _calculateSeed(word) {
    // Take each character in the word, get its char code, and append it to
    // a long digit string. Then turn that digit string into a number
    return Number(_(' ' + word).reduce(function (stringSeed, nextChar) {
      return stringSeed + String(nextChar.charCodeAt(0));
    }));
  }

  function Drawing(node, word) {
    this.word = word;

    // All units are in px
    this.width = node.getBoundingClientRect().width;
    this.height = node.getBoundingClientRect().height;

    // Parameterize the drawing with the word
    this.chance = new Chance(_calculateSeed(word));

    // Create the drawing
    this.svg = d3.select(node).append('svg')
      .attr({ width: this.width, height: this.height });

    return this;
  }

  Drawing.prototype._calculateGridPoints = function () {
    var pointIndex = 0;
    var rowScale;

    var word = this.word;
    var height = this.height;
    var width = this.width;

    // Map the row indices to appropriate y coordinates
    rowScale = d3.scale.linear()
      .domain([-1, word.length])
      .range([0, height]);

    return _(word)
      // Convert each character in the word into a binary number
      .map(function (char) {
        return char.charCodeAt(0).toString(2);
      })
      // Convert each binary number into an x-y grid point for each 1
      .map(function (rowBinaryString, rowIndex, binaryNumbers) {
        var gridPoints = [];
        // Calculate the y value for this row
        var trimmedString = rowBinaryString.substring(2);

        // Map the column indices to appropriate x coordinates
        var colScale = d3.scale.linear()
          .domain([-1, trimmedString.length])
          .range([0, width]);

        _.forEach(trimmedString, function (digit, columnIndex) {

          // If this column corresponds to a 1, calculate its coordinate and
          // add an x/y grid point
          if (parseInt(digit, 2)) {
            gridPoints.push({
              id: ++pointIndex,
              x: colScale(columnIndex),
              y: rowScale(rowIndex),
            });
          }
        });

        return gridPoints;
      }).value();
  };

  Drawing.prototype.draw = function () {
    var gridPoints;
    var self = this;

    // Parameterize the drawing with the word
    gridPoints = self._calculateGridPoints();

    _.forEach(gridPoints, function (points) {
      self.svg.selectAll('circle')
        .data(points, function (d) { return d.id; }).enter()
          .append('circle')
            .attr('cx', function (d) { return d.x; })
            .attr('cy', function (d) { return d.y; })
            .attr('r', 5);
    });

    return self;
  };

  function makeGift(word, attachTo) {
    return new Drawing(attachTo, word).draw();
  }

  return {
    makeGift: makeGift
  };
};
