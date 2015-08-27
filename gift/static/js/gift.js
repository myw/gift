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

    // Work in normalized coordinates
    this.scales = {};

    this.scales.width = d3.scale.linear()
      .domain([0, 1])
      .range([0, this.width]);

    this.scales.height = d3.scale.linear()
      .domain([0, 1])
      .range([0, this.height]);

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

    function _indexToFraction(index, maxIndex) {
      return (index  + 1) / (maxIndex);
    }

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

        _.forEach(trimmedString, function (digit, columnIndex) {

          // If this column corresponds to a 1, calculate its coordinate and
          // add an x/y grid point
          if (parseInt(digit, 2)) {
            gridPoints.push({
              id: ++pointIndex,
              x: _indexToFraction(columnIndex, trimmedString.length),
              y: _indexToFraction(rowIndex, word.length),
            });
          }
        });

        return gridPoints;
      }).value();
  };

  Drawing.prototype._calculatePeaks = function (gridPoints) {
    var self = this;

    var pointsPerRow = 50;

    function _peak(relX, center, width) {
      // Deals with scaled units (0, 1)
      var peakHeight =  (1 - Math.abs(center - relX) / width);

      // No negative peak heights
      return peakHeight < 0 ? 0 : peakHeight;
    }

    return _.map(gridPoints, function (row, rowIndex) {
      // Deals with scaled units (0, 1)
      var relXs = d3.range(0, 1, 1 / pointsPerRow);
      var peaks = [];

      _.forEach(row, function (gridPoint) {
        // Pick a peak center and width with some noise
        var peakCenter = gridPoint.x + self.chance.floating({min: -0.1, max: 0.1});
        var peakWidth = 0.25 + self.chance.floating({min: -0.05, max: 0.05});

        var peak = _.map(relXs, function (relX) {
          return _peak(
            relX,
            peakCenter,
            peakWidth
          );
        });

        peak[0] = 0;
        peak[peak.length - 1] = 0;
        peaks.push(peak);
      });

      // Sum along the columns
      relYs = _.map(_.range(peaks[0].length), function () { return 0; });
      _.forEach(peaks, function (peak) {
        _.forEach(peak, function (peakHeight, xPosition) {
          relYs[xPosition] += peakHeight;
        });
      });


      // Normalize and center
      var heightScale = (_.max(relYs) * (gridPoints.length + 1) * 1.25);
      relYs = _.map(relYs, function (y) { return row[0].y - y / heightScale; });

      return _.map(_.zip(relXs, relYs), function (xy) {
        return {
          id: rowIndex,
          x: xy[0],
          y: xy[1],
        };
      });
    });
  };

  Drawing.prototype.draw = function () {
    var self = this;

    var lineGen = d3.svg.line()
      .x(function (d) { return self.scales.width(d.x); })
      .y(function (d) { return self.scales.height(d.y); })
      .interpolate('basis');

    // Parameterize the drawing with the word
    var gridPoints = self._calculateGridPoints();
    var peakLines = self._calculatePeaks(gridPoints);

    _.forEach(peakLines, function (peakLine) {
      self.svg.selectAll('path.peak')
        .data(peakLine, function (d) { return d.id; }).enter()
          .append('svg:path')
            .attr('d', lineGen(peakLine))
            .attr('class', 'peak');
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
