// 1.0 - Hand-Crafted Space Station Layout
// Converted from user's ASCII box layout
// 
// LEGEND:
// # = Wall
// . = Corridor/hallway
// (space) = Void/inaccessible dead space (between walls, not rendered)
// B = Base (starting point)
// R = Generic room interior
//
// MISSION DOORS (single tile that triggers mission):
// 1 = Medical Bay door
// 2 = Engineering Deck door
// 3 = Security Wing door
// 4 = Crew Quarters door
// 5 = Research Labs door
// 6 = Shopping Mall door
// 7 = Maintenance Hub door
// 8 = Communications door
// 9 = Cargo Bay door
// A = Corporate Offices door
// D = Reactor Chamber door (mission 11)
// C = Observation Deck door (mission 12)
// H = Hangar Bay door (final escape room)
//
// ROOM INTERIORS (fill entire room with these):
// M = Medical Bay interior (mission 1)
// E = Engineering Deck interior (mission 2)
// W = Security Wing interior (mission 3)
// Q = Crew Quarters interior (mission 4)
// Y = Research Labs interior (mission 5)
// P = Shopping Mall interior (mission 6)
// N = Maintenance Hub interior (mission 7)
// O = Communications interior (mission 8)
// G = Cargo Bay interior (mission 9)
// F = Corporate Offices interior (mission 10)
// T = Reactor Chamber interior (mission 11)
// V = Observation Deck interior (mission 12)
// J = Hangar Bay interior (final escape room)
//
// Note: Survivors, loot, and aliens spawn randomly on valid tiles
// based on terrain-specific spawn rates (configured in save.js)

const STATION_MAP = `
##########################################################################################################################################
#SSSSSSSSSSSSSSSSSS#                                         #..........#                                    #MMMMMMMMMMMMMMMMMMMMMMMMMMM#
#SSSSSSSSSSSSSSSSSS#                                         #..........#                                    #MMMMMMMMMMMMMMMMMMMMMMMMMMM#
#SSSSSSSSSSSSSSSSSS###########################################..........######################################MMMMMMMMMMMMMMMMMMMMMMMMMMM#
#SSSSSSSSSSSSSSSSSS#.........................................................................................#MMMMMMMMMMMMMMMMMMMMMMMMMMM#
#SSSSSSSSSBSSSSSSSSS.........................................................................................1MMMMMMMMMMMMMMMMMMMMMMMMMMM#
#SSSSSSSSSSSSSSSSSS#.........................................................................................#MMMMMMMMMMMMMMMMMMMMMMMMMMM#
#SSSSSSSSSSSSSSSSSS###########################################..........###############.......################MMMMMMMMMMMMMMMMMMMMMMMMMMM#
#SSSSSSSSSSSSSSSSSS#                                         #..........#             #.......#              #MMMMMMMMMMMMMMMMMMMMMMMMMMM#
####################                                         #..........#             #.......#              #MMMMMMMMMMMMMMMMMMMMMMMMMMM#
#                                                            #..........#             #.......#              #############################
#                                                            #..........#             #.......#                                          #
###############                                              #..........#             #.......#      #####################################
#EEEEEEEEEEEEE#                                              #..........#             #.......#      #YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY#
#EEEEEEEEEEEEE#                                              #..........#             #.......########YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY#
#EEEEEEEEEEEEE#                                              #..........#             #..............5YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY#
#EEEEEEEEEEEEE################################################..........#             #.......########YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY#
#EEEEEEEEEEEEE#.........................................................#             #.......#      #YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY#
#EEEEEEEEEEEEE#.........................................................#             #.......#      #####################################
#EEEEEEEEEEEEE2.........................................................#             #.......#                                          #
#EEEEEEEEEEEEE#.........................................................#             #.......#                         ##################
#EEEEEEEEEEEEE############################.......#############..........#             #.......#                         #WWWWWWWWWWWWWWWW#
#EEEEEEEEEEEEE#                          #.......#           #..........###############.......###################       #WWWWWWWWWWWWWWWW#
#EEEEEEEEEEEEE#                          #.......#           #..................................................#  ######WWWWWWWWWWWWWWWW#
#EEEEEEEEEEEEE#                          #.......#           #..................................................#  #WWWWWWWWWWWWWWWWWWWWW#
#EEEEEEEEEEEEE#                          #.......#           #..................................................####WWWWWWWWWWWWWWWWWWWWW#
###############                          #.......#           #..........###############.......###########..........#WWWWWWWWWWWWWWWWWWWWW#
#                                        #.......#           #..........#             #.......#         #..........3WWWWWWWWWWWWWWWWWWWWW#
#########################                #.......#           #..........#             #.......#         #...########WWWWWWWWWWWWWWWWWWWWW#
#PPPPPPPPPPPPPPPPPPPPPPP#                #.......#           #..........#             #.......#         #...#      #WWWWWWWWWWWWWWWWWWWWW#
#PPPPPPPPPPPPPPPPPPPPPPP#                #.......#           #..........#             #.......#         #...#      ######WWWWWWWWWWWWWWWW#
#PPPPPPPPPPPPPPPPPPPPPPP##################.......#           #..........#             #.......#     ######4#####        #WWWWWWWWWWWWWWWW#
#PPPPPPPPPPPPPPPPPPPPPPP#........................#           #..........#             #.......#     #QQQQQQQQQQ#        ##################
#PPPPPPPPPPPPPPPPPPPPPPP6........................#           #..........#             #.......#     #QQQQQQQQQQ###########################
#PPPPPPPPPPPPPPPPPPPPPPP##################.......#           #..........#             #.......#     #QQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQ#
#PPPPPPPPPPPPPPPPPPPPPPP#                #.......#           #..........#             #.......#     #QQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQ#
#PPPPPPPPPPPPPPPPPPPPPPP#                #.......#           #..........#             #.......#     #QQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQ#
#########################                #.......#           #..........#             #.......#     #QQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQ#
#                                        #.......#           #..........#             #.......#     ######################################
##########################################.......#############..........###############.......############################################
#........................................................................................................................................#
#........................................................................................................................................#
#........................................................................................................................................#
###########################################......#############..........###############.......############################################
#                                         #......#           #..........#             #.......#                                          #
#                                         #......#           #..........#             #.......#              #############################
############################              #......#           #..........#             #.......#              #FFFFFFFFFFFFFFFFFFFFFFFFFFF#
#NNNNNNNNNNNNNNNNNNNNNNNNNN#              #......#           #..........#             #.......#              #FFFFFFFFFFFFFFFFFFFFFFFFFFF#
#NNNNNNNNNNNNNNNNNNNNNNNNNN#              #......#           #..........#             #.......#              #FFFFFFFFFFFFFFFFFFFFFFFFFFF#
#NNNNNNNNNNNNNNNNNNNNNNNNNN#              #......#           #..........#             #.......################FFFFFFFFFFFFFFFFFFFFFFFFFFF#
#NNNNNNNNNNNNNNNNNNNNNNNNNN################......#############..........###############......................#FFFFFFFFFFFFFFFFFFFFFFFFFFF#
#NNNNNNNNNNNNNNNNNNNNNNNNNN#.................................................................................AFFFFFFFFFFFFFF##############
#NNNNNNNNNNNNNNNNNNNNNNNNNN7...................................................................######....#####FFFFFFFFFFFFFF#            #
#NNNNNNNNNNNNNNNNNNNNNNNNNN#...................................................................#    #....#   #FFFFFFFFFFFFFF#            #
#NNNNNNNNNNNNNNNNNNNNNNNNNN###....#########......#############..........###############........#    #....#   #FFFFFFFFFFFFFF#  ###########
#NNNNNNNNNNNNNNNNNNNNNNNNNN# #....#       #......#           #..........#             #........#    #....#   #FFFFFFFFFFFFFF#  #JJJJJJJJJ#
############################ #....#       #......#           #..........#             #........#    #....#   #FFFFFFFFFFFFFF#  #JJJJJJJJJ#
#                            #....#       #......#           #..........#             #........#    #....#   #FFFFFFFFFFFFFF#  #JJJJJJJJJ#
#                        #####....#       #......#           #..........#             #........#    #....#   ################  #JJJJJJJJJ#
######################   #........#       #......#           #..........#             #........#    #....#                     #JJJJJJJJJ#
#GGGGGGGGGGGGGGGGGGGG#   #....#####       #......#           #..........#       ###########8####### #....#######################JJJJJJJJJ#
#GGGGGGGGGGGGGGGGGGGG#   #....#    ##########D###########    #..........#       #OOOOOOOOOOOOOOOOO# #..........................#JJJJJJJJJ#
#GGGGGGGGGGGGGGGGGGGG#   #....#    #TTTTTTTTTTTTTTTTTTTT#    #..........#       #OOOOOOOOOOOOOOOOO# #..........................HJJJJJJJJJ#
#GGGGGGGGGGGGGGGGGGGG#   #....#    #TTTTTTTTTTTTTTTTTTTT#    #..........#       #OOOOOOOOOOOOOOOOO# ############....############JJJJJJJJJ#
#GGGGGGGGGGGGGGGGGGGG#   #....#    #TTTTTTTTTTTTTTTTTTTT#    #..........#       #OOOOOOOOOOOOOOOOO#            #....#          #JJJJJJJJJ#
#GGGGGGGGGGGGGGGGGGGG#   #....#    #TTTTTTTTTTTTTTTTTTTT#    #..........#       #OOOOOOOOOOOOOOOOO#     #########C##########   #JJJJJJJJJ#
#GGGGGGGGGGGGGGGGGGGG#####....#    #TTTTTTTTTTTTTTTTTTTT#    #..........#       #OOOOOOOOOOOOOOOOO#     #VVVVVVVVVVVVVVVVVV#   #JJJJJJJJJ#
#GGGGGGGGGGGGGGGGGGGG9........#    #TTTTTTTTTTTTTTTTTTTT#    #..........#       #OOOOOOOOOOOOOOOOO#     #VVVVVVVVVVVVVVVVVV#   #JJJJJJJJJ#
#GGGGGGGGGGGGGGGGGGGG##########    #TTTTTTTTTTTTTTTTTTTT#    #..........#       #OOOOOOOOOOOOOOOOO#     #VVVVVVVVVVVVVVVVVV#   #JJJJJJJJJ#
#GGGGGGGGGGGGGGGGGGGG#             #TTTTTTTTTTTTTTTTTTTT#    #..........#       #OOOOOOOOOOOOOOOOO#     #VVVVVVVVVVVVVVVVVV#   #JJJJJJJJJ#
#GGGGGGGGGGGGGGGGGGGG#             #TTTTTTTTTTTTTTTTTTTT#    #..........#       #OOOOOOOOOOOOOOOOO#     #VVVVVVVVVVVVVVVVVV#   #JJJJJJJJJ#
#GGGGGGGGGGGGGGGGGGGG#             #TTTTTTTTTTTTTTTTTTTT#    #..........#       #OOOOOOOOOOOOOOOOO#     #VVVVVVVVVVVVVVVVVV#   #JJJJJJJJJ#
#GGGGGGGGGGGGGGGGGGGG#             #TTTTTTTTTTTTTTTTTTTT#    #..........#       #OOOOOOOOOOOOOOOOO#     #VVVVVVVVVVVVVVVVVV#   #JJJJJJJJJ#
##########################################################################################################################################
`;

function parseStationMap() {
  const lines = STATION_MAP.trim().split('\n');
  const height = lines.length;
  const width = lines[0].length;
  
  const tiles = [];
  const missionDoors = {};
  let basePos = null;
  let hangarPos = null;
  
  for (let y = 0; y < height; y++) {
    const line = lines[y];
    for (let x = 0; x < width; x++) {
      const char = line[x] || '#';
      const idx = y * width + x;
      
      let terrain = 'wall';
      let content = null;
      
      // Parse terrain and content
      if (char === ' ') {
        terrain = 'void';  // Inaccessible dead space
      } else if (char === '#') {
        terrain = 'wall';
      } else if (char === '.') {
        terrain = 'corridor';
      } else if (char === 'R') {
        terrain = 'room';
      } else if (char === 'S') {
        terrain = 'baseRoom';  // 1.0 - Safe base room tiles (no spawns, unique color)
      } else if (char === 'B') {
        terrain = 'baseRoom';  // 1.0 - Base spawn point (also uses baseRoom terrain)
        content = 'base';
        basePos = { x, y, idx };
      } else if ('123456789ACDH'.includes(char)) {
        // Mission doors (1-9, A=10, D=11, C=12, H=hangar)
        let missionNum;
        if (char === 'A') missionNum = 10;
        else if (char === 'D') missionNum = 11;
        else if (char === 'C') missionNum = 12;
        else if (char === 'H') {
          // Hangar door (not a numbered mission)
          terrain = 'hangarDoor';
          content = 'hangar';
          hangarPos = { x, y, idx };
        } else {
          missionNum = parseInt(char);
        }
        
        // Assign specific terrain type for mission door
        if (char !== 'H') {
          terrain = `mission${missionNum}Door`;
          content = 'mission';
          missionDoors[missionNum] = { x, y, idx, char };
        }
      } else if (char === 'M') {
        terrain = 'medicalBay';  // Mission 1 interior
      } else if (char === 'E') {
        terrain = 'engineeringDeck';  // Mission 2 interior
      } else if (char === 'W') {
        terrain = 'securityWing';  // Mission 3 interior
      } else if (char === 'Q') {
        terrain = 'crewQuarters';  // Mission 4 interior
      } else if (char === 'Y') {
        terrain = 'researchLabs';  // Mission 5 interior
      } else if (char === 'P') {
        terrain = 'shoppingMall';  // Mission 6 interior
      } else if (char === 'N') {
        terrain = 'maintenanceHub';  // Mission 7 interior
      } else if (char === 'O') {
        terrain = 'communications';  // Mission 8 interior
      } else if (char === 'G') {
        terrain = 'cargoBay';  // Mission 9 interior
      } else if (char === 'F') {
        terrain = 'corporateOffices';  // Mission 10 interior
      } else if (char === 'T') {
        terrain = 'reactorChamber';  // Mission 11 interior
      } else if (char === 'V') {
        terrain = 'observationDeck';  // Mission 12 interior
      } else if (char === 'J') {
        terrain = 'hangarBay';  // Hangar interior
      }
      
      tiles[idx] = {
        x, y,
        terrain,
        content,
        scouted: false,
        cleared: false,
        aliens: []
      };
    }
  }
  
  return {
    width,
    height,
    tiles,
    missionDoors,
    basePos,
    hangarPos
  };
}