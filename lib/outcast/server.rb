require 'rack'
require 'erb'

module Outcast
  class Server
    
    PORT     = 8166
    MANIFEST = '/'
    CALLBACK = 'jsonpcallback'
    
    SERVER_DIR = File.expand_path(File.dirname(__FILE__))
    MANIFEST_TEMPLATE = File.join(SERVER_DIR, 'manifest.erb')
    
    def self.start(dir)
      new(dir).start
    end
    
    def initialize(dir)
      @dir = File.expand_path(dir)
      puts "Starting Outcast server at #{dir}"
      
      @library = ITunes.load_library(dir) do |track|
        puts "#{ track[ITunes::ARTIST] } : #{ track[ITunes::NAME] }"
      end
      puts "\nReady! Listening on port #{PORT}"
    end
    
    def start
      rack_handler.run(self, :Port => PORT)
    end
    
    def call(env)
      request = Rack::Request.new(env)
      response = case request.path_info
      when MANIFEST then manifest(request)
      end
      [200, {"Content-Type" => "text/html"}, [response]]
    end
    
    def manifest(request)
      jsonp_callback = request.params['jsonp'] || CALLBACK
      ERB.new(File.read(MANIFEST_TEMPLATE)).result(binding)
    end
    
  private
    
    def rack_handler
      %w[thin mongrel webrick].each do |server|
        begin
          return Rack::Handler.get(server)
        rescue LoadError, NameError
        end
      end
    end
    
  end
end
