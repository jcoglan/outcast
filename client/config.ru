require 'rubygems'
require 'rack'
require 'faye'
require File.dirname(__FILE__) + '/app'

use Faye::RackAdapter, :mount => '/comet'
run Sinatra::Application
