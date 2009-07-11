require 'sinatra'
require 'singleton'

module Outcast
  class Server
    
    include Singleton
    attr_reader :library, :dir
    
    PORT = 8166
    JSONP_CALLBACK = 'jsonpcallback'
    
    def self.start(dir)
      instance.start(dir)
    end
    
    def start(dir)
      Sinatra::Application.set :views, File.dirname(__FILE__)
      
      Sinatra::Application.get('/') do
        @jsonp_callback = params['jsonp'] || JSONP_CALLBACK
        @library = Outcast::Server.instance.library
        erb :manifest
      end
      
      Sinatra::Application.get('/play/*') do
        file = Outcast::Server.instance.dir + '/' + CGI.unescape(params['splat'].first)
        headers('Content-Type' => 'application/octet-stream')
        send_file(file)
      end
      
      @dir = File.expand_path(dir)
      puts "Starting Outcast server at #{dir}"
      
      @library = ITunes.load_library(dir) do |track|
        puts "#{ track[ITunes::ARTIST] } : #{ track[ITunes::NAME] }"
      end
      puts "\nReady! Listening on port #{PORT}"
      
      rack_handler.run(Sinatra::Application, :Port => PORT)
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
