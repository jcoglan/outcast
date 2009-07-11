require 'rexml/document'
require 'rexml/streamlistener'
require 'cgi'
require 'date'
require 'forwardable'
require 'observer'
require 'set'

module Outcast  
  module ITunes
    XML_FILE  = 'iTunes Music Library.xml'
    
    INTEGER   = /^[0-9]+$/
    KEY       = 'key'
    DICT      = 'dict'
    TRUE      = 'true'
    FALSE     = 'false'
    
    TRACKS    = 'Tracks'
    PLAYLISTS = 'Playlists'
    ARTIST    = 'Artist'
    ALBUM     = 'Album'
    NAME      = 'Name'
    NUMBER    = 'Track Number'
    LOCATION  = 'Location'
    
    def self.load_library(dir, &block)
      dir    = File.expand_path(dir)
      xml    = File.new(File.join(dir, XML_FILE))
      tracks = []
      parser = XmlListener.new
  
      parser.add_observer(Observer.new { |track|
        tracks << track
        track[LOCATION] = CGI.unescape(track[LOCATION]).
                          gsub(%r{^.*#{dir}}i, '')
        block.call(track) if block
      })
      
      REXML::Document.parse_stream(xml, parser)
      
      Library.new(tracks)
    end
    
    class Observer
      def initialize(&block)
        @block = block
      end
      
      def update(*args)
        @block.call(*args)
      end
    end
    
    class XmlListener
      include REXML::StreamListener
      include Observable
      attr_reader :current
      
      def initialize
        @listening  = false
        @key        = false
        @name       = nil
        @type       = nil
        @current    = nil
      end
      
      def tag_start(name, attrs)
        case name
        when TRUE, FALSE then   @current[@name] = (name == TRUE) if @current
        when KEY then           @key = true
        else                    @type = name
        end
      end
      
      def text(string)
        @listening = true  if @key and string == TRACKS
        @listening = false if @key and string == PLAYLISTS
        return unless @listening
        
        if @key
          if string =~ INTEGER
            @current = {}
          else
            @name = string
          end
        else
          return unless @current and @type
          @current[@name] = case @type
                            when 'date'     then  Date.parse(string)
                            when 'integer'  then  string.to_i
                            else                  string
                            end
        end
      end
      
      def tag_end(name)
        @key  = false
        @type = nil
        return unless @current and @listening
        
        if name == DICT
          changed(true)
          notify_observers(@current)
          @current = nil
        end
      end
    end
    
    class Library
      include Enumerable
      extend Forwardable
      def_delegators :@tracks, :size, :[]
      
      def initialize(tracks)
        @tracks = tracks
      end
      
      def artists
        @artists ||= @tracks.inject(Set.new) do |set, track|
          set.add(track[ARTIST])
        end
      end
      
      def albums
        @albums ||= @tracks.inject(Set.new) do |set, track|
          set.add(track[ALBUM])
        end
      end
      
      def each(&block)
        return enum_for(:each) unless block_given?
        @tracks.each(&block)
      end
      
      def each_artist(&block)
        return enum_for(:each_artist) unless block_given?
        artists.each(&block)
      end
      
      def each_album(&block)
        return enum_for(:each_album) unless block_given?
        albums.each(&block)
      end
    end
    
  end
end
