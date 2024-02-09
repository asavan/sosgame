# Sos game

### Websoket game.

[![Test covered](https://github.com/asavan/sosgame/actions/workflows/static.yml/badge.svg)](https://github.com/asavan/sosgame/actions/workflows/static.yml)

### Rules
Two players play a game on a line of N squares.  
Each player in turn puts either S or O into an empty square.  
The game stops when three adjacent squares contain S, O, S in that order and the last player wins.  
If all the squares are filled without getting S, O, S, then the game is drawn.


### Solution
Suppose a square is such that if you play there then that allows your opponent to win on the following move. If you play an O, then your opponent must win by playing an adjacent S. So we must have S 1 2 3, where 1 and 2 are empty and you play O on square 1. But you also lose if you play S, so your opponent must then win by playing O on 2, which means that 3 must already contain an S. But now the situation is symmetrical, so that 2 is also a losing square. Thus, until someone plays on one of them, losing squares always occur in pairs.

The board has an even number of squares, so the first player always faces a board with an even number of squares not yet occupied, whereas the second player always faces a board with an odd number of squares not yet occupied. Thus provided (1) there is at least one pair of losing squares, (2) he never plays on a losing square, and (3) he makes the obvious winning move if the first player ever creates the opportunity, then the second player is sure to win, because the first player will eventually face a board with only losing squares available for play.

To make sure there is at least one pair of losing squares the second player must create it. He can always do this by placing an S on his first move well away from the first player's move and from the edges of the board. Then on his second move (assuming the first player has not been stupid enough to allow him an immediate win) he can always play another S three away from it, creating a pair of losing squares. Thereafter, he must simply take care to win if there is a winning move and otherwise to avoid losing plays.

