# Cache Simulator

This project was adapted from one I completed in CS211 Computer Architecture.
Originally written in C with no visualization, I decided to transform the project into
a visual tool that could help others understand how caches operate.

C code for cache system was transformed into Typescript then converted into Javascript and added drawing functionality.

The input is a set of 48-bit memory addresses with either a read (R) or write (W) on the left column. 

The visualization uses a two level cache to more closely simulate what modern CPU's use. In my implementation
I used an exclusive cache; where L2 cache is a "victim cache", containing only evicted blocks of L1 cache.

The output on the lower left of the screen shows the number of memory reads, memory writes, number of cache hits
for L1 and L2, as well as the number of cache misses for L1 and L2.

As the cache simulator steps through it's process, different colors are displayed/outlined.
When it's searching through a set it will highlight it orange, then move onto the blocks highlighting them orange.
If nothing is found it will highlight both red, if the tag is found it will highlight the set and block blue indicating
it has found it's place. Once the tag is placed both set and block will highlight green.
This process will start in L1 then move onto L2.

The empty squares of each block represent data from memory. To keep the simulation about pure cache mechanics, this part is not necessary.

Test it out at: https://shanehoffman.github.io/CacheSimulator/

# TO-DO
  - Add an input check for wrong inputs
  - Update sizing in more optimally for different screens, (works best with 1080p or higher)
  - Add a better reset function
