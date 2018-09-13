function Vertex2(x, y) {
  this.x = x;
  this.y = y;
}

function Triangle(a, b, c) {
  this.a = a;
  this.b = b;
  this.c = c;
  
  // We Calculate the circumcircle of the Triangle
  var A = b.x - a.x;
  var B = b.y - a.y;
  var C = c.x - a.x;
  var D = c.y - a.y;
  var E = A * (a.x + b.x) + B * (a.y + b.y);
  var F = C * (a.x + c.x) + D * (a.y + c.y);
  var G = 2 * (A * (c.y - b.y) - B * (c.x - b.x));
  
  var minx, miny, dx, dy;
  
  /*
  * If the points of the triangle are collinear, then just find the
  * extremes and use the midpoint as the center of the circumcircle.
  */
  if (Math.abs(G) < 0.000001) {
    minx = Math.min(a.x, b.x, c.x);
    miny = Math.min(a.y, b.y, c.y);
    dx = (Math.max(a.x, b.x, c.x) - minx) * 0.5;
    dy = (Math.max(a.y, b.y, c.y) - miny) * 0.5;
    this.x = minx + dx;
    this.y = miny + dy;
    this.r = dx * dx + dy * dy;
  } else {
    this.x = (D * E - B * F) / G;
    this.y = (A * F - C * E) / G;
    dx = this.x - a.x;
    dy = this.y - a.y;
    this.r = dx * dx + dy * dy;
  }
}

function Delaunay(container, options) {
  if(typeof container === 'undefined'){
    console.error('Showcase3D: Container is undefined');
    return;
  }
  
  // Default options
  if(typeof options === 'undefined') options = new Object();
  
  var canvas = document.createElement("canvas");
  var ctx = canvas.getContext("2d");

  canvas.width = $(container).width();
  canvas.height = $(container).height();
  container.appendChild(canvas);
  
  this.vertices = new Array(); //This variable holds the vertices
  this.triangles = new Array();
  
  /**
  * Generates random Vertices to make a Triangulation
  */
  this.generateRandomVertices = function (nPoints) {
    this.vertices = new Array();
    
    for (var i = 0; i < nPoints; i++) {
      x = Math.random();
      y = Math.random();
      
      this.vertices[i] = new Vertex2(x, y);
    }
  }

  /**
   *
   */
  this.generateDistributedVertices = function (xDivisions, yDivisions) {
    this.vertices = []

    for (let i = 0; i < xDivisions; i++) {
      for (let j = 0; j < yDivisions; j++) {
        let x = 1 / xDivisions * i + Math.random() * (1 / xDivisions)
        let y = 1 / yDivisions * j + Math.random() * (1 / yDivisions)
        
        this.vertices[i * xDivisions + j] = new Vertex2(x, y)
      }
    }
  }
  
  /**
  * Function to order vertices by their "x" coordinate
  */
  function byX(a, b) {
    return b.x - a.x;
  }
  
  /**
  * Removes duplicated edges
  */
  function uniqueEdges(edges) {
    var j = edges.length, a, b, i, m, n;
    
    outer: while (j) {
      b = edges[--j];
      a = edges[--j];
      i = j;
      while (i) {
        n = edges[--i];
        m = edges[--i];
        if ((a === m && b === n) || (a === n && b === m)) {
          edges.splice(j, 2);
          edges.splice(i, 2);
          j -= 2;
          continue outer;
        }
      }
    }
  }
  
  /**
  * Creates the triangulation
  */
  this.triangulate = function (vertices) {
    console.time("Triangulate");
    /* Bail if there aren't enough vertices to form any triangles. */
    if (this.vertices.length < 3)
      return [];
      
    /* Ensure the vertex array is in order of descending X coordinate
    * (which is needed to ensure a subquadratic runtime), and then find
    * the bounding box around the points. */
    this.vertices.sort(byX);
    var i = this.vertices.length - 1;
    var xmin = this.vertices[i].x;
    var xmax = this.vertices[0].x;
    var ymin = this.vertices[i].y;
    var ymax = ymin;
    
    while (i--) {
      if (this.vertices[i].y < ymin) ymin = this.vertices[i].y;
      if (this.vertices[i].y > ymax) ymax = this.vertices[i].y;
    }
    
    /* Find a supertriangle, which is a triangle that surrounds all the
     * vertices. This is used like something of a sentinel value to remove
     * cases in the main algorithm, and is removed before we return any
     * results.
     *
     * Once found, put it in the "open" list. (The "open" list is for
     * triangles who may still need to be considered; the "closed" list is
     * for triangles which do not.) */
    var dx = xmax - xmin;
    var dy = ymax - ymin;
    var dmax = (dx > dy) ? dx : dy;
    var xmid = (xmax + xmin) * 0.5;
    var ymid = (ymax + ymin) * 0.5;
    
    var open = [
      new Triangle({
        x: xmid - 20 * dmax,
        y: ymid - dmax,
        __sentinel: true
      }, {
        x: xmid,
        y: ymid + 20 * dmax,
        __sentinel: true
      }, {
        x: xmid + 20 * dmax,
        y: ymid - dmax,
        __sentinel: true
      })
    ];
    
    var closed = [];
    var edges = [];
    var j, a, b;
    
    /* Incrementally add each vertex to the mesh. */
    i = this.vertices.length;
    
    while (i--) {
      /* For each open triangle, check to see if the current point is
       * inside it's circumcircle. If it is, remove the triangle and add
       * it's edges to an edge list. */
      edges.length = 0;
      j = open.length;
      
      while (j--) {
        /* If this point is to the right of this triangle's circumcircle,
         * then this triangle should never get checked again. Remove it
         * from the open list, add it to the closed list, and skip. */
        dx = this.vertices[i].x - open[j].x;
        
        if (dx > 0 && dx * dx > open[j].r) {
          closed.push(open[j]);
          open.splice(j, 1);
          continue;
        }
        
        /* If not, skip this triangle. */
        dy = this.vertices[i].y - open[j].y;
        if (dx * dx + dy * dy > open[j].r)
          continue;
        
        /* Remove the triangle and add it's edges to the edge list. */
        edges.push(
          open[j].a, open[j].b,
          open[j].b, open[j].c,
          open[j].c, open[j].a
        )
        open.splice(j, 1);
      }
      
      /* Remove any doubled edges. */
      uniqueEdges(edges);
      
      /* Add a new triangle for each edge. */
      j = edges.length;
      
      while (j) {
        b = edges[--j];
        a = edges[--j];
        open.push(new Triangle(a, b, this.vertices[i]));
      }
    }
    
    /* Copy any remaining open triangles to the closed list, and then
     * remove any triangles that share a vertex with the supertriangle. */
    Array.prototype.push.apply(closed, open);
    i = closed.length;
    while (i--) {
      if (closed[i].a.__sentinel || closed[i].b.__sentinel || closed[i].c.__sentinel)
        closed.splice(i, 1);
      
      /* Yay, we're done! */
      this.triangles = closed;
    }
    console.timeEnd("Triangulate");
  }

  this.renderVertices = function () {
    console.time('Render Vertices')

    for (let v of this.vertices) {
      ctx.beginPath()
      ctx.arc(v.x * canvas.width, v.y * canvas.height, 5, 0, 2 * Math.PI)
      ctx.fillStyle = 'red'
      ctx.fill()
      ctx.stroke()
    }

    console.timeEnd('Render Vertices')
  }
  
  /**
  * Draws the triangulation into the canvas
  */
  this.render = function() {
    console.time("Render");
    var t;
    
    for (var i in this.triangles) {
      t = this.triangles[i];
      
      ctx.beginPath();
      ctx.moveTo(t.a.x * canvas.width, t.a.y * canvas.height);
      ctx.lineTo(t.b.x * canvas.width, t.b.y * canvas.height);
      ctx.lineTo(t.c.x * canvas.width, t.c.y * canvas.height);
      ctx.closePath();
      ctx.stroke();
    }
    console.timeEnd("Render");
  }
}
