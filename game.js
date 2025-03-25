
      const canvas = document.getElementById("gameCanvas");
      const ctx = canvas.getContext("2d");

      // Screen dimensions
      let WIDTH = 800;
      let HEIGHT = 600;
      canvas.width = WIDTH;
      canvas.height = HEIGHT;

      // Colors
      const WHITE = "rgb(255, 255, 255)";
      const BLACK = "rgb(0, 0, 0)";
      const RED = "rgb(255, 50, 50)";
      const GREEN = "rgb(50, 255, 50)";
      const BLUE = "rgb(50, 50, 255)";
      const YELLOW = "rgb(255, 255, 0)";
      const PURPLE = "rgb(150, 50, 200)";
      const CYAN = "rgb(0, 255, 255)";
      const ORANGE = "rgb(255, 165, 0)";
      const PINK = "rgb(255, 192, 203)";

      // Game variables
      let FPS = 60;
      let gameInterval;

      // Physics
      let gravity = 0.5;
      let gravity_direction = 1; // 1 for down, -1 for up

      // Background stars
      let stars = [];
      for (let i = 0; i < 100; i++) {
        let x = Math.floor(Math.random() * WIDTH);
        let y = Math.floor(Math.random() * HEIGHT);
        let size = Math.floor(Math.random() * 3) + 1;
        let brightness = Math.floor(Math.random() * 156) + 100;
        stars.push({
          x: x,
          y: y,
          size: size,
          brightness: brightness
        });
      }

      // Particle System class
      class ParticleSystem {
        constructor() {
          this.particles = [];
        }

        addParticles(x, y, color, count = 10) {
          for (let i = 0; i < count; i++) {
            let vx = Math.random() * 6 - 3;
            let vy = Math.random() * 6 - 3;
            let lifetime = Math.floor(Math.random() * 21) + 20;
            let size = Math.floor(Math.random() * 4) + 2;
            this.particles.push({
              x: x,
              y: y,
              vx: vx,
              vy: vy,
              lifetime: lifetime,
              size: size,
              color: color,
            });
          }
        }

        update() {
          this.particles = this.particles.filter((p) => p.lifetime > 0);
          this.particles.forEach((p) => {
            p.x += p.vx;
            p.y += p.vy;
            p.lifetime--;
          });
        }

        draw() {
          this.particles.forEach((p) => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.fill();
            ctx.closePath();
          });
        }
      }

      // Player class
      class Player {
        constructor() {
          this.radius = 20;
          this.x = WIDTH / 4;
          this.y = HEIGHT / 2;
          this.vel_x = 0;
          this.vel_y = 0;
          this.jump_power = -12;
          this.speed = 5;
          this.on_ground = false;
          this.color = RED;
          this.trail = [];
          this.max_trail = 10;
        }

        update() {
          // Add position to trail
          this.trail.push({
            x: this.x,
            y: this.y
          });
          if (this.trail.length > this.max_trail) {
            this.trail.shift();
          }

          // Apply gravity
          this.vel_y += gravity * gravity_direction;

          // Apply velocity
          this.x += this.vel_x;
          this.y += this.vel_y;

          // Screen boundaries
          if (this.x - this.radius < 0) {
            this.x = this.radius;
            this.vel_x = 0;
          } else if (this.x + this.radius > WIDTH) {
            this.x = WIDTH - this.radius;
            this.vel_x = 0;
          }

          // Reset on_ground
          this.on_ground = false;
        }

        draw() {
          // Draw trail
          for (let i = 0; i < this.trail.length; i++) {
            let pos = this.trail[i];
            let alpha = Math.floor(255 * (i / this.trail.length));
            let trail_color = `rgba(${Math.min(
              255,
              this.color.match(/\d+/g)[0] * 1 + 50
            )}, ${Math.min(
              255,
              this.color.match(/\d+/g)[1] * 1 + 50
            )}, ${Math.min(
              255,
              this.color.match(/\d+/g)[2] * 1 + 50
            )}, ${alpha / 255})`;
            let trail_radius = Math.floor(this.radius * (i / this.trail.length));

            ctx.beginPath();
            ctx.arc(pos.x, pos.y, trail_radius, 0, Math.PI * 2);
            ctx.fillStyle = trail_color;
            ctx.fill();
            ctx.closePath();
          }

          // Draw player
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
          ctx.fillStyle = this.color;
          ctx.fill();
          ctx.closePath();

          // Draw inner circle for effect
          let inner_radius = this.radius / 2;
          let inner_color = `rgb(${Math.min(
            255,
            this.color.match(/\d+/g)[0] * 1 + 100
          )}, ${Math.min(
            255,
            this.color.match(/\d+/g)[1] * 1 + 100
          )}, ${Math.min(255, this.color.match(/\d+/g)[2] * 1 + 100)})`;

          ctx.beginPath();
          ctx.arc(this.x, this.y, inner_radius, 0, Math.PI * 2);
          ctx.fillStyle = inner_color;
          ctx.fill();
          ctx.closePath();
        }

        jump() {
          if (this.on_ground) {
            this.vel_y = this.jump_power * gravity_direction;
          }
        }
      }

      // Platform class
      class Platform {
        constructor(x, y, width, height, color = GREEN, moving = false, speed = 0, vertical = false) {
          this.x = x;
          this.y = y;
          this.width = width;
          this.height = height;
          this.color = color;
          this.moving = moving;
          this.speed = speed;
          this.direction = 1;
          this.vertical = vertical;
          this.original_pos = {
            x: x,
            y: y
          };
          this.move_range = Math.floor(Math.random() * 101) + 100;
          this.glow_value = 0;
          this.glow_direction = 1;
        }

        update() {
          // Update platform position if moving
          if (this.moving) {
            if (this.vertical) {
              this.y += this.speed * this.direction;
              if (Math.abs(this.y - this.original_pos.y) > this.move_range) {
                this.direction *= -1;
              }
            } else {
              this.x += this.speed * this.direction;
              if (Math.abs(this.x - this.original_pos.x) > this.move_range) {
                this.direction *= -1;
              }
            }
          }

          // Update glow effect
          this.glow_value += 0.05 * this.glow_direction;
          if (this.glow_value > 1) {
            this.glow_value = 1;
            this.glow_direction = -1;
          } else if (this.glow_value < 0) {
            this.glow_value = 0;
            this.glow_direction = 1;
          }
        }

        draw() {
          let safe_color = this.color;

          let draw_width = Math.max(1, this.width);
          let draw_height = Math.max(1, this.height);

          // Base platform
          ctx.fillStyle = safe_color;
          ctx.fillRect(this.x, this.y, draw_width, draw_height);

          // Glow effect
          let glow_color = `rgba(${Math.min(255, parseInt(safe_color.match(/\d+/g)[0]) + 50)}, ${Math.min(255, parseInt(safe_color.match(/\d+/g)[1]) + 50)}, ${Math.min(255, parseInt(safe_color.match(/\d+/g)[2]) + 50)}, ${this.glow_value})`;
          ctx.fillStyle = glow_color;
          ctx.fillRect(this.x, this.y, draw_width, draw_height);

          // Edge highlight
          let highlight_thickness = 2;
          ctx.fillStyle = glow_color;
          ctx.fillRect(this.x, this.y, draw_width, highlight_thickness); // Top
          ctx.fillRect(this.x, this.y, highlight_thickness, draw_height); // Left

          // Moving platform indicator
          if (this.moving) {
            let indicator_size = 5;
            for (let i = 0; i < 3; i++) {
              let offset = i * 10;
              ctx.beginPath();
              ctx.arc(
                this.x + draw_width / 2,
                this.y + draw_height / 2 - 10 + offset,
                indicator_size,
                0,
                Math.PI * 2
              );
              ctx.fillStyle = WHITE;
              ctx.fill();
              ctx.closePath();
            }
          }
        }
      }

      // Collectable class
      class Collectable {
        constructor(x, y) {
          this.x = x;
          this.y = y;
          this.radius = 10;
          this.color = YELLOW;
          this.collected = false;
          this.angle = 0;
          this.hover_offset = 0;
          this.hover_speed = 0.05;
          this.glow_size = 0;
          this.glow_direction = 1;
        }

        update() {
          if (!this.collected) {
            this.angle += 0.05;
            this.hover_offset = Math.sin(this.angle) * 3;

            // Update glow effect
            this.glow_size += 0.1 * this.glow_direction;
            if (this.glow_size > 5) {
              this.glow_direction = -1;
            } else if (this.glow_size < 0) {
              this.glow_direction = 1;
            }
          }
        }

        draw() {
          if (!this.collected) {
            // Draw glow
            ctx.beginPath();
            ctx.arc(
              this.x,
              this.y + this.hover_offset,
              this.radius + this.glow_size,
              0,
              Math.PI * 2
            );
            ctx.fillStyle = "rgba(255, 255, 0, 0.4)";
            ctx.fill();
            ctx.closePath();

            // Draw collectable
            ctx.beginPath();
            ctx.arc(
              this.x,
              this.y + this.hover_offset,
              this.radius,
              0,
              Math.PI * 2
            );
            ctx.fillStyle = this.color;
            ctx.fill();
            ctx.closePath();

            // Draw inner shine
            let shine_radius = this.radius / 2;
            let shine_color = "rgb(255, 255, 200)";
            ctx.beginPath();
            ctx.arc(
              this.x - 2,
              this.y - 2 + this.hover_offset,
              shine_radius,
              0,
              Math.PI * 2
            );
            ctx.fillStyle = shine_color;
            ctx.fill();
            ctx.closePath();
          }
        }
      }

      // Portal class for level transition
      class Portal {
        constructor(x, y) {
          this.x = x;
          this.y = y;
          this.radius = 25;
          this.color = CYAN;
          this.angle = 0;
          this.particles = [];
        }

        update() {
          this.angle += 0.05;

          // Add particles
          if (Math.random() > 0.7) {
            let angle = Math.random() * 2 * Math.PI;
            let speed = Math.random() * 1.5 + 0.5;
            let lifetime = Math.floor(Math.random() * 21) + 20;
            this.particles.push({
              x: this.x + Math.cos(angle) * this.radius,
              y: this.y + Math.sin(angle) * this.radius,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              lifetime: lifetime,
              color: [CYAN, BLUE, PURPLE][Math.floor(Math.random() * 3)],
            });
          }

          // Update particles
          this.particles = this.particles.filter((p) => p.lifetime > 0);
          this.particles.forEach((p) => {
            p.x += p.vx;
            p.y += p.vy;
            p.lifetime--;
          });
        }

        draw() {
          // Draw particles
          this.particles.forEach((p) => {
            let alpha = p.lifetime / 40;
            let size = 3 * alpha;
            ctx.beginPath();
            ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.fill();
            ctx.closePath();
          });

          // Draw portal rings
          for (let i = 0; i < 3; i++) {
            let offset = Math.sin(this.angle + i) * 5;
            ctx.beginPath();
            ctx.arc(
              this.x,
              this.y,
              this.radius - i * 5 + offset,
              0,
              Math.PI * 2
            );
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.closePath();
          }

          // Draw central glow
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.radius / 2, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(0, 255, 255, 0.6)";
          ctx.fill();
          ctx.closePath();
        }
      }

      // Create particle system
      let particles = new ParticleSystem();

      // Level design function
      function createLevel(levelNum) {
        let player = new Player();
        let platforms = [];
        let collectables = [];
        let portal = null;

        // Customize player color based on level
        let level_colors = [RED, BLUE, PURPLE, ORANGE, PINK];
        player.color = level_colors[levelNum % level_colors.length];

        // Base platform always exists
        if (levelNum === 0) {
          // First level has a big base
          platforms.push(new Platform(0, HEIGHT - 50, WIDTH, 50, GREEN));
        } else {
          // Higher levels have smaller bases
          let base_width = WIDTH - levelNum * 100;
          platforms.push(
            new Platform(
              (WIDTH - base_width) / 2,
              HEIGHT - 50,
              base_width,
              50,
              GREEN
            )
          );
        }

        // Level-specific platform patterns
        let platform_count;
        let moving_chance;
        let max_speed;

        if (levelNum === 0) {
          // Level 1: Mostly static platforms, beginner-friendly
          platform_count = 8;
          moving_chance = 0.3;
          max_speed = 2;
        } else if (levelNum === 1) {
          // Level 2: More moving platforms
          platform_count = 10;
          moving_chance = 0.5;
          max_speed = 3;
        } else if (levelNum === 2) {
          // Level 3: Fast moving platforms, more vertical ones
          platform_count = 12;
          moving_chance = 0.7;
          max_speed = 4;
        } else if (levelNum === 3) {
          // Level 4: Challenging layout
          platform_count = 10;
          moving_chance = 0.8;
          max_speed = 5;
        } else {
          // Level 5+: Very challenging
          platform_count = 8 + levelNum;
          moving_chance = 0.9;
          max_speed = 5;
        }

        // Create platform color palette based on level
        let platform_colors = [
          GREEN,
          BLUE,
          PURPLE,
          `rgb(${50 + levelNum * 30}, ${200 - levelNum * 20}, ${
            100 + levelNum * 30
          })`,
          `rgb(${200 - levelNum * 15}, ${50 + levelNum * 30}, 150)`,
        ];

        // Generate platforms for this level
        for (let i = 0; i < platform_count; i++) {
          let width = Math.floor(Math.random() * (201 - levelNum * 10)) + 80;
          let height = Math.floor(Math.random() * 11) + 15;
          let x = Math.floor(Math.random() * (WIDTH - width));
          let y = Math.floor(Math.random() * (HEIGHT - 150)) + 100; 
          let is_moving = Math.random() < moving_chance;
          let speed = is_moving ? Math.floor(Math.random() * max_speed) + 1 : 0;
          let vertical = is_moving ? Math.random() > 0.5 : false;
          let color = platform_colors[Math.floor(Math.random() * platform_colors.length)];

          platforms.push(
            new Platform(x, y, width, height, color, is_moving, speed, vertical)
          );
        }

        // Generate collectables
        let collectable_count = 5 + levelNum * 2;
        for (let i = 0; i < collectable_count; i++) {
          let attempts = 0;
          while (attempts < 20) {
            let x = Math.floor(Math.random() * (WIDTH - 100)) + 50;
            let y = Math.floor(Math.random() * (HEIGHT - 150)) + 50;

            let good_placement = false;
            for (let platform of platforms) {
              if (
                Math.abs(y - (platform.y - 30)) < 50 &&
                x > platform.x - 20 &&
                x < platform.x + platform.width + 20
              ) {
                good_placement = true;
                break;
              }
            }

            let inside_block = false;
            for (let platform of platforms) {
              if (
                x > platform.x &&
                x < platform.x + platform.width &&
                y > platform.y &&
                y < platform.y + platform.height
              ) {
                inside_block = true;
                break;
              }
            }

            if ((good_placement || attempts > 15) && !inside_block) {
              collectables.push(new Collectable(x, y));
              break;
            }

            attempts++;
          }
        }

        // Add portal for level completion (not on the first level)
        if (levelNum > 0) {
          // Place portal on a high platform or in a challenging spot
          platforms.sort((a, b) => a.y - b.y);
          for (let platform of platforms) {
            if (platform.y < HEIGHT / 2) {
              let portal_x = platform.x + platform.width / 2;
              let portal_y = platform.y - 40;
              portal = new Portal(portal_x, portal_y);
              break;
            }
          }
        }

        if (portal === null) {
          // Fallback if no suitable platform found
          portal = new Portal(WIDTH / 2, 100);
        }

        return {
          player: player,
          platforms: platforms,
          collectables: collectables,
          portal: portal,
        };
      }

      // Game state
      let level = 0;
      let score = 0;
      let total_score = 0;
      let game_over = false;
      let level_complete = false;
      let transition_alpha = 0;
      let transition_state = "none"; // none, fade_out, fade_in
      let message_timer = 0;

      // Level selection variables
      let level_select = false;
      let levels_unlocked = 1; // Start with only the first level unlocked
      let furthest_level_reached = 0;

      // Main menu variable
      let main_menu = true; // Control the display of the main menu

      // Create initial level
      let {
        player,
        platforms,
        collectables,
        portal,
      } = createLevel(level);

      // Key states
      let keys = {};
      document.addEventListener("keydown", (e) => {
        keys[e.code] = true;
      });
      document.addEventListener("keyup", (e) => {
        keys[e.code] = false;
      });

      // Mouse click event
      let mouse_clicked = false;
      canvas.addEventListener("mousedown", () => {
        mouse_clicked = true;
      });
      canvas.addEventListener("mouseup", () => {
        mouse_clicked = false;
      });

      // UI elements
      function drawButton(text, x, y, width, height, normal_color, hover_color) {
        let mouse_pos = {
          x: mouseX,
          y: mouseY,
        };
        let button_rect = {
          x: x,
          y: y,
          width: width,
          height: height
        };

        // Check if mouse is over button
        let color = normal_color;
        if (
          mouse_pos.x > button_rect.x &&
          mouse_pos.x < button_rect.x + button_rect.width &&
          mouse_pos.y > button_rect.y &&
          mouse_pos.y < button_rect.y + button_rect.height
        ) {
          color = hover_color;
        }

        // Draw button
        ctx.fillStyle = color;
        ctx.fillRect(button_rect.x, button_rect.y, button_rect.width, button_rect.height);
        ctx.strokeStyle = WHITE;
        ctx.lineWidth = 2;
        ctx.strokeRect(button_rect.x, button_rect.y, button_rect.width, button_rect.height);

        // Draw text
        ctx.font = "36px Arial";
        ctx.fillStyle = WHITE;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(
          text,
          button_rect.x + button_rect.width / 2,
          button_rect.y + button_rect.height / 2
        );

        return button_rect;
      }

      // Function to draw level selection buttons
      function drawLevelSelect() {
        let num_levels = 5; // Example number of levels
        let button_width = 150;
        let button_height = 50;
        let start_x = (WIDTH - (button_width * num_levels) / 2) / 2;
        let start_y = HEIGHT / 3;
        let button_spacing = 20;
        let level_buttons = [];

        for (let i = 0; i < num_levels; i++) {
          let x = start_x + i * (button_width + button_spacing);
          let y = start_y;
          let normal_color = i < levels_unlocked ? "rgb(50, 150, 50)" : "rgb(100, 100, 100)";
          let hover_color = i < levels_unlocked ? "rgb(100, 200, 100)" : "rgb(150, 150, 150)";
          let button_text = i < levels_unlocked ? `Level ${i + 1}` : "Locked";
          let button_rect = drawButton(
            button_text,
            x,
            y,
            button_width,
            button_height,
            normal_color,
            hover_color
          );
          level_buttons.push({
            rect: button_rect,
            level: i
          });
        }

        let back_rect = drawButton(
          "Back",
          WIDTH / 2 - 75,
          (HEIGHT * 2) / 3,
          150,
          50,
          "rgb(50, 50, 100)",
          "rgb(100, 100, 200)"
        );
        level_buttons.push({
          rect: back_rect,
          level: -1
        }); // -1 indicates the back button
        return level_buttons;
      }

      // Game states
      let paused = false;
      let show_controls = false;

      // Mouse position
      let mouseX = 0;
      let mouseY = 0;

      canvas.addEventListener("mousemove", (e) => {
        let rect = canvas.getBoundingClientRect();
        mouseX = e.clientX - rect.left;
        mouseY = e.clientY - rect.top;
      });

      // Main game loop
      function gameLoop() {
        // Handle transition states
        if (transition_state === "fade_out") {
          transition_alpha += 10;
          if (transition_alpha >= 255) {
            transition_alpha = 255;

            // Create new level when fully faded out
            level += 1;
            let levelData = createLevel(level);
            player = levelData.player;
            platforms = levelData.platforms;
            collectables = levelData.collectables;
            portal = levelData.portal;

            // Reset game state
            score = 0;
            game_over = false;
            level_complete = false;
            gravity_direction = 1;
            main_menu = false;

            // Start fade in
            transition_state = "fade_in";
          }
        } else if (transition_state === "fade_in") {
          transition_alpha -= 10;
          if (transition_alpha <= 0) {
            transition_alpha = 0;
            transition_state = "none";
            message_timer = 180; // Show level message for 3 seconds
          }
        }

        // Update game state if not paused and not in transition
        if (
          !paused &&
          transition_state === "none" &&
          !game_over &&
          !level_complete &&
          !level_select &&
          !main_menu
        ) {
          // Player controls
          player.vel_x = 0;
          if (keys["ArrowLeft"]) {
            player.vel_x = -player.speed;
          }
          if (keys["ArrowRight"]) {
            player.vel_x = player.speed;
          }
          if (keys["ArrowUp"]) {
            player.jump();
          }

          // Update player
          player.update();

          // Update collectables
          for (let c of collectables) {
            c.update();
          }

          // Update portal
          if (portal) {
            portal.update();
          }

          // Update particles
          particles.update();

          // Check for platform collisions
          for (let platform of platforms) {
            platform.update();

            // Collision detection changes based on gravity direction
            if (gravity_direction === 1) {
              // Normal gravity
              if (
                player.y + player.radius > platform.y &&
                player.y - player.radius < platform.y + platform.height &&
                player.x + player.radius > platform.x &&
                player.x - player.radius < platform.x + platform.width
              ) {
                // Landing on top of platform
                if (
                  player.vel_y > 0 &&
                  player.y - player.radius < platform.y
                ) {
                  player.y = platform.y - player.radius;
                  player.vel_y = 0;
                  player.on_ground = true;
                  if (Math.abs(player.vel_y) > 8) {
                    // Only show particles on hard landings
                    particles.addParticles(
                      player.x,
                      player.y + player.radius,
                      platform.color,
                      5
                    );
                  }
                } else if (
                  player.vel_y < 0 &&
                  player.y + player.radius > platform.y + platform.height
                ) {
                  player.y = platform.y + platform.height + player.radius;
                  player.vel_y = 0;
                }
              }
            } else {
              // Inverted gravity
              if (
                player.y + player.radius > platform.y &&
                player.y - player.radius < platform.y + platform.height &&
                player.x + player.radius > platform.x &&
                player.x - player.radius < platform.x + platform.width
              ) {
                // "Landing" on bottom of platform
                if (
                  player.vel_y < 0 &&
                  player.y + player.radius > platform.y + platform.height
                ) {
                  player.y = platform.y + platform.height + player.radius;
                  player.vel_y = 0;
                  player.on_ground = true;
                  if (Math.abs(player.vel_y) > 8) {
                    // Only show particles on hard landings
                    particles.addParticles(
                      player.x,
                      player.y - player.radius,
                      platform.color,
                      5
                    );
                  }
                } else if (
                  player.vel_y > 0 &&
                  player.y - player.radius < platform.y
                ) {
                  player.y = platform.y - player.radius;
                  player.vel_y = 0;
                }
              }
            }
          }

          // Check for collectable collisions
          for (let c of collectables) {
            if (!c.collected) {
              let distance =
                (player.x - c.x) ** 2 + (player.y - c.y) ** 2;
              if (distance <= (player.radius + c.radius) ** 2) {
                c.collected = true;
                score += 10;
                total_score += 10;
                particles.addParticles(c.x, c.y, c.color, 15);
              }
            }
          }

          // Check for portal collision if all collectables collected
          if (portal && collectables.every((c) => c.collected)) {
            let distance =
              (player.x - portal.x) ** 2 + (player.y - portal.y) ** 2;
            if (
              distance <= (player.radius + portal.radius) ** 2
            ) {
              level_complete = true;
              particles.addParticles(player.x, player.y, portal.color, 30);
              furthest_level_reached = Math.max(
                furthest_level_reached,
                level
              );
            }
          }

          // Check if player fell off the screen
          if (player.y < -50 || player.y > HEIGHT + 50) {
            game_over = true;
          }

          // Decrease message timer
          if (message_timer > 0) {
            message_timer--;
          }
        }

        // Drawing
        // Draw stars background
        ctx.fillStyle = BLACK;
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
        for (let star of stars) {
          // Make stars twinkle
          let brightness = star.brightness + Math.floor(Math.random() * 41) - 20;
          brightness = Math.max(100, Math.min(255, brightness));
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgb(${brightness}, ${brightness}, ${brightness})`;
          ctx.fill();
          ctx.closePath();
        }

        // Draw game elements if not in main menu, level select, or paused
        if (
          !main_menu &&
          !level_select &&
          !paused &&
          !show_controls &&
          !game_over &&
          !level_complete
        ) {
          // Draw platforms
          for (let platform of platforms) {
            platform.draw();
          }

          // Draw portal
          if (portal) {
            portal.draw();
          }

          // Draw collectables
          for (let c of collectables) {
            c.draw();
          }

          // Draw particles
          particles.draw();

          // Draw player
          player.draw();

          // Draw HUD
          ctx.font = "36px Arial";
          ctx.fillStyle = WHITE;
          ctx.textAlign = "left";
          ctx.textBaseline = "top";

          // Score
          ctx.fillText(`Score: ${score}`, 10, 10);

          // Total score
          ctx.fillText(`Total: ${total_score}`, 10, 50);

          // Level
          ctx.textAlign = "right";
          ctx.fillText(`Level: ${level + 1}`, WIDTH - 10, 10);

          // Gravity indicator
          ctx.fillText(
            `Gravity: ${gravity_direction === 1 ? "↓" : "↑"}`,
            WIDTH - 10,
            50
          );

          // Collectables remaining
          let collected = collectables.filter((c) => c.collected).length;
          ctx.textAlign = "center";
          ctx.fillText(
            `Items: ${collected}/${collectables.length}`,
            WIDTH / 2,
            10
          );

          // Level message
          if (message_timer > 0) {
            ctx.font = "60px Arial";
            ctx.textAlign = "center";
            let level_msg = `Level ${level + 1}`;
            let msg_alpha = Math.min(1, message_timer / 60);
            ctx.fillStyle = `rgba(255, 255, 255, ${msg_alpha})`;
            ctx.fillText(level_msg, WIDTH / 2, HEIGHT / 3);
          }
        }

        // Pause menu
        if (paused) {
          // Semi-transparent overlay
          ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
          ctx.fillRect(0, 0, WIDTH, HEIGHT);

          // Pause text
          ctx.font = "60px Arial";
          ctx.fillStyle = WHITE;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("PAUSED", WIDTH / 2, HEIGHT / 4);

          // Buttons
          let resume_rect = drawButton(
            "Resume",
            WIDTH / 2 - 100,
            HEIGHT / 2 - 30,
            200,
            50,
            "rgb(50, 100, 50)",
            "rgb(100, 200, 100)"
          );

          let controls_rect = drawButton(
            "Controls",
            WIDTH / 2 - 100,
            HEIGHT / 2 + 40,
            200,
            50,
            "rgb(50, 50, 100)",
            "rgb(100, 100, 200)"
          );

          let quit_rect = drawButton(
            "Quit Game",
            WIDTH / 2 - 100,
            HEIGHT / 2 + 110,
            200,
            50,
            "rgb(100, 50, 50)",
            "rgb(200, 100, 100)"
          );

          // Handle button clicks
          if (mouse_clicked) {
            if (
              mouseX > resume_rect.x &&
              mouseX < resume_rect.x + resume_rect.width &&
              mouseY > resume_rect.y &&
              mouseY < resume_rect.y + resume_rect.height
            ) {
              paused = false;
            } else if (
              mouseX > controls_rect.x &&
              mouseX < controls_rect.x + controls_rect.width &&
              mouseY > controls_rect.y &&
              mouseY < controls_rect.y + controls_rect.height
            ) {
              show_controls = true;
              paused = false;
            } else if (
              mouseX > quit_rect.x &&
              mouseX < quit_rect.x + quit_rect.width &&
              mouseY > quit_rect.y &&
              mouseY < quit_rect.y + quit_rect.height
            ) {
              clearInterval(gameInterval);
              running = false;
            }
            mouse_clicked = false;
          }
        }

        // Controls screen
        if (show_controls) {
          // Semi-transparent overlay
          ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
          ctx.fillRect(0, 0, WIDTH, HEIGHT);

          // Controls title
          ctx.font = "60px Arial";
          ctx.fillStyle = WHITE;
          ctx.textAlign = "center";
          ctx.textBaseline = "top";
          ctx.fillText("CONTROLS", WIDTH / 2, HEIGHT / 6);

          // Controls text
          let controls = [
            "LEFT/RIGHT - Move player",
            "UP - Jump",
            "SPACE - Flip gravity",
            "P - Pause game",
            "H - Show/hide controls",
            "R - Restart level (when game over)",
          ];

          ctx.font = "36px Arial";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          for (let i = 0; i < controls.length; i++) {
            ctx.fillText(controls[i], WIDTH / 2, HEIGHT / 3 + i * 50);
          }

          // Back button
          let back_rect = drawButton(
            "Back",
            WIDTH / 2 - 100,
            (HEIGHT * 3) / 4,
            200,
            50,
            "rgb(50, 50, 100)",
            "rgb(100, 100, 200)"
          );

          if (mouse_clicked) {
            if (
              mouseX > back_rect.x &&
              mouseX < back_rect.x + back_rect.width &&
              mouseY > back_rect.y &&
              mouseY < back_rect.y + back_rect.height
            ) {
              show_controls = false;
            }
            mouse_clicked = false;
          }
        }

        // Game over or level complete screens
        if (game_over) {
          ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
          ctx.fillRect(0, 0, WIDTH, HEIGHT);

          ctx.font = "60px Arial";
          ctx.fillStyle = RED;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("GAME OVER", WIDTH / 2, HEIGHT / 3);

          ctx.font = "36px Arial";
          ctx.fillStyle = WHITE;
          ctx.fillText("Press R to retry level", WIDTH / 2, HEIGHT / 2);

          ctx.fillText(
            `Total Score: ${total_score}`,
            WIDTH / 2,
            HEIGHT / 2 + 50
          );

          if (keys["KeyR"]) {
            let levelData = createLevel(level);
            player = levelData.player;
            platforms = levelData.platforms;
            collectables = levelData.collectables;
            portal = levelData.portal;
            score = 0;
            game_over = false;
            keys["KeyR"] = false; // Prevent immediate repeat
          }
        } else if (level_complete) {
          ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
          ctx.fillRect(0, 0, WIDTH, HEIGHT);

          ctx.font = "60px Arial";
          ctx.fillStyle = GREEN;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(`LEVEL ${level + 1} COMPLETE!`, WIDTH / 2, HEIGHT / 3);

          let next_rect = drawButton(
            "Next Level",
            WIDTH / 2 - 100,
            HEIGHT / 2 - 35,
            200,
            50,
            "rgb(50, 150, 50)",
            "rgb(100, 200, 100)"
          );

          let retry_rect = drawButton(
            "Retry Level",
            WIDTH / 2 - 100,
            HEIGHT / 2 + 35,
            200,
            50,
            "rgb(150, 100, 50)",
            "rgb(200, 150, 100)"
          );

          let main_menu_rect = drawButton(
            "Main Menu",
            WIDTH / 2 - 100,
            HEIGHT / 2 + 105,
            200,
            50,
            "rgb(50, 100, 150)",
            "rgb(100, 150, 200)"
          );

          ctx.font = "36px Arial";
          ctx.fillStyle = WHITE;
          ctx.fillText(`Level Score: ${score}`, WIDTH / 2, HEIGHT / 2 - 100);

          if (mouse_clicked) {
            if (
              mouseX > next_rect.x &&
              mouseX < next_rect.x + next_rect.width &&
              mouseY > next_rect.y &&
              mouseY < next_rect.y + next_rect.height
            ) {
              transition_state = "fade_out";
              levels_unlocked = Math.max(levels_unlocked, level + 2);
              mouse_clicked = false;
            } else if (
              mouseX > retry_rect.x &&
              mouseX < retry_rect.x + retry_rect.width &&
              mouseY > retry_rect.y &&
              mouseY < retry_rect.y + retry_rect.height
            ) {
              let levelData = createLevel(level);
              player = levelData.player;
              platforms = levelData.platforms;
              collectables = levelData.collectables;
              portal = levelData.portal;
              score = 0;
              game_over = false;
              level_complete = false;
              mouse_clicked = false;
            } else if (
              mouseX > main_menu_rect.x &&
              mouseX < main_menu_rect.x + main_menu_rect.width &&
              mouseY > main_menu_rect.y &&
              mouseY < main_menu_rect.y + main_menu_rect.height
            ) {
              main_menu = true;
              level_select = false;
              game_over = false;
              level_complete = false;
              transition_state = "none";
              level = 0;
              let levelData = createLevel(level);
              player = levelData.player;
              platforms = levelData.platforms;
              collectables = levelData.collectables;
              portal = levelData.portal;
              score = 0;
              total_score = 0;
              mouse_clicked = false;
            } else {
              mouse_clicked = false;
            }
          }
        }

        // Level selection screen
        if (level_select) {
          let level_buttons = drawLevelSelect();

          if (mouse_clicked) {
            for (let button of level_buttons) {
              if (
                mouseX > button.rect.x &&
                mouseX < button.rect.x + button.rect.width &&
                mouseY > button.rect.y &&
                mouseY < button.rect.y + button.rect.height
              ) {
                if (button.level === -1) {
                  level_select = false;
                  main_menu = true;
                } else if (button.level < levels_unlocked) {
                  level = button.level;
                  let levelData = createLevel(level);
                  player = levelData.player;
                  platforms = levelData.platforms;
                  collectables = levelData.collectables;
                  portal = levelData.portal;
                  score = 0;
                  game_over = false;
                  level_complete = false;
                  level_select = false;
                  main_menu = false;
                  transition_state = "none";
                }
                mouse_clicked = false;
                break; // Prevent multiple clicks
              }
            }
          }
        }

        // Main menu
        if (main_menu) {
          // Semi-transparent overlay
          ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
          ctx.fillRect(0, 0, WIDTH, HEIGHT);

          // Game title
          ctx.font = "60px Arial";
          ctx.fillStyle = WHITE;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("Gravity Platformer", WIDTH / 2, HEIGHT / 4 - 50);

          // Buttons
          let start_rect = drawButton(
            "Start Game",
            WIDTH / 2 - 100,
            HEIGHT / 2 - 30,
            200,
            50,
            "rgb(50, 150, 50)",
            "rgb(100, 200, 100)"
          );
          let level_select_rect = drawButton(
            "Level Select",
            WIDTH / 2 - 100,
            HEIGHT / 2 + 40,
            200,
            50,
            "rgb(50, 50, 150)",
            "rgb(100, 100, 200)"
          );
          let controls_rect = drawButton(
            "Controls",
            WIDTH / 2 - 100,
            HEIGHT / 2 + 110,
            200,
            50,
            "rgb(50, 50, 100)",
            "rgb(100, 100, 200)"
          );

          let quit_rect = drawButton(
            "Quit Game",
            WIDTH / 2 - 100,
            HEIGHT / 2 + 180,
            200,
            50,
            "rgb(150, 50, 50)",
            "rgb(200, 100, 100)"
          );

          // Handle button clicks
          if (mouse_clicked) {
            if (
              mouseX > start_rect.x &&
              mouseX < start_rect.x + start_rect.width &&
              mouseY > start_rect.y &&
              mouseY < start_rect.y + start_rect.height
            ) {
              level = furthest_level_reached;
              let levelData = createLevel(level);
              player = levelData.player;
              platforms = levelData.platforms;
              collectables = levelData.collectables;
              portal = levelData.portal;
              score = 0;
              total_score = 0;
              game_over = false;
              level_complete = false;
              level_select = false;
              main_menu = false;
              transition_state = "none";
              mouse_clicked = false;
            } else if (
              mouseX > level_select_rect.x &&
              mouseX < level_select_rect.x + level_select_rect.width &&
              mouseY > level_select_rect.y &&
              mouseY < level_select_rect.y + level_select_rect.height
            ) {
              level_select = true;
              main_menu = false;
              mouse_clicked = false;
            } else if (
              mouseX > controls_rect.x &&
              mouseX < controls_rect.x + controls_rect.width &&
              mouseY > controls_rect.y &&
              mouseY < controls_rect.y + controls_rect.height
            ) {
              show_controls = true;
              main_menu = false;
              mouse_clicked = false;
            } else if (
              mouseX > quit_rect.x &&
              mouseX < quit_rect.x + quit_rect.width &&
              mouseY > quit_rect.y &&
              mouseY < quit_rect.y + quit_rect.height
            ) {
              clearInterval(gameInterval);
              running = false;
              mouse_clicked = false;
            }
          }
        }

        // Draw transition overlay
        if (transition_state !== "none") {
          ctx.fillStyle = `rgba(0, 0, 0, ${transition_alpha / 255})`;
          ctx.fillRect(0, 0, WIDTH, HEIGHT);
        }

        // Gravity flip control
        if (keys["Space"] && !game_over && !level_complete && !level_select && !main_menu) {
          gravity_direction *= -1;
          particles.addParticles(player.x, player.y, player.color, 20);
          keys["Space"] = false; // Prevent immediate repeat
        }

        // Pause toggle control
        if (keys["KeyP"] && !level_select && !main_menu) {
          paused = !paused;
          keys["KeyP"] = false; // Prevent immediate repeat
        }

        // Show controls toggle control
        if (keys["KeyH"] && !level_select && !main_menu) {
          show_controls = !show_controls;
          keys["KeyH"] = false; // Prevent immediate repeat
        }

        // Check for window resize
        if (WIDTH !== canvas.width || HEIGHT !== canvas.height) {
          WIDTH = canvas.width;
          HEIGHT = canvas.height;
        }

        // Next frame
        if (running) {
          requestAnimationFrame(gameLoop);
        }
      }

      // Start the game loop
      let running = true;
      requestAnimationFrame(gameLoop); // Start the animation loop




