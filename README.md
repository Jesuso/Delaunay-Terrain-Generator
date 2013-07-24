Voronoi Terrain Generation Tool
===============================

This is a fork from ironwallaby's delaunay project. For more information about
the delaunay generator check out his project at: https://github.com/ironwallaby/delaunay

I'll be working on this project and try to turn it into a real 2D/3D Terrain Generator Tool
and maybe add some exporters later so terrains generated with this program can be used
on any other language.

But in the meantime it is just what it is, a simple 2D Delaunay generator based on a bunch
of random points.

I encapsulated the functions into a Delaunay class to make its usage a bit
simplier, you can create a new Delaunay Triangulation just by doing:

```javascript
var d = new Delaunay($("#delaunay")[0]);
d.generateRandomVertices(2048);
d.triangulate();
d.render();
```

Hope you find this useful!